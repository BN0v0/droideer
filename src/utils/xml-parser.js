import xml2js from 'xml2js';

export async function parseUIHierarchy(xmlString) {
    try {
        // Clean the XML string first
        const cleanedXml = cleanXMLString(xmlString);
        
        // Parse with xml2js
        const parser = new xml2js.Parser({
            explicitArray: true,
            explicitChildren: true,
            preserveChildrenOrder: true,
            charsAsChildren: true,
            includeWhiteChars: false,
            normalize: false,
            normalizeTags: false,
            trim: true
        });
        
        const result = await new Promise((resolve, reject) => {
            parser.parseString(cleanedXml, (err, result) => {
                if (err) {
                    reject(new Error(`XML parsing failed: ${err.message}`));
                } else {
                    resolve(result);
                }
            });
        });

        if (!result || !result.hierarchy || !result.hierarchy.node) {
            throw new Error('Invalid XML structure: missing hierarchy or node');
        }

        const rootNode = result.hierarchy.node[0];
        return processNode(rootNode, 0);
        
    } catch (error) {
        console.error('Error parsing UI hierarchy:', error.message);
        console.error('XML preview:', xmlString.substring(0, 200) + '...');
        
        // Return a minimal structure if parsing fails
        return {
            id: 0,
            tag: 'hierarchy',
            class: 'android.widget.FrameLayout',
            'resource-id': '',
            text: 'UI Parsing Failed - Please refresh',
            'content-desc': 'UI hierarchy could not be parsed',
            bounds: '[0,0][1080,1920]',
            clickable: 'false',
            enabled: 'true',
            children: []
        };
    }
}

function cleanXMLString(xmlString) {
    if (!xmlString || typeof xmlString !== 'string') {
        throw new Error('Invalid XML string provided');
    }
    
    // Remove any leading/trailing whitespace
    let cleaned = xmlString.trim();
    
    // Remove any non-XML content before the <?xml declaration or <hierarchy> tag
    const xmlStartMatch = cleaned.match(/<\?xml|<hierarchy/);
    if (xmlStartMatch) {
        cleaned = cleaned.substring(xmlStartMatch.index);
    }
    
    // Fix common XML issues
    cleaned = cleaned
        // Remove null bytes and other problematic characters
        .replace(/\0/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Fix unclosed tags that might appear in dumpsys output
        .replace(/&(?![a-zA-Z0-9#]{1,8};)/g, '&amp;')
        // Ensure proper XML declaration if missing
        .replace(/^<hierarchy/, '<?xml version="1.0" encoding="UTF-8"?><hierarchy');
    
    return cleaned;
}

function processNode(node, id = 0) {
    // Extract all attributes with proper defaults
    const attributes = node.$ || {};
    
    // Ensure all important attributes exist with proper defaults
    const processedNode = {
        id: id,
        tag: 'node',
        
        // Core identification attributes
        class: attributes.class || 'android.view.View',
        'resource-id': attributes['resource-id'] || '',
        text: attributes.text || '',
        'content-desc': attributes['content-desc'] || '',
        
        // Layout attributes
        bounds: attributes.bounds || '[0,0][0,0]',
        index: attributes.index || '0',
        package: attributes.package || '',
        
        // State attributes
        clickable: attributes.clickable || 'false',
        'long-clickable': attributes['long-clickable'] || 'false',
        enabled: attributes.enabled || 'true',
        selected: attributes.selected || 'false',
        focused: attributes.focused || 'false',
        focusable: attributes.focusable || 'false',
        scrollable: attributes.scrollable || 'false',
        checkable: attributes.checkable || 'false',
        checked: attributes.checked || 'false',
        password: attributes.password || 'false',
        'visible-to-user': attributes['visible-to-user'] || 'true',
        
        // Store all original attributes for debugging
        attributes: { ...attributes },
        
        // Children array
        children: []
    };
    
    // Add bounds parsing for easier access
    if (processedNode.bounds) {
        const boundsMatch = processedNode.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (boundsMatch) {
            const [, x1, y1, x2, y2] = boundsMatch.map(Number);
            processedNode.boundsRect = {
                x1, y1, x2, y2,
                centerX: Math.floor((x1 + x2) / 2),
                centerY: Math.floor((y1 + y2) / 2),
                width: x2 - x1,
                height: y2 - y1
            };
        }
    }
    
    // Generate a unique selector for this element
    processedNode.selector = generateSelector(processedNode);
    
    // Process children
    let childId = id * 1000 + 1;
    if (node.node && Array.isArray(node.node)) {
        for (const child of node.node) {
            processedNode.children.push(processNode(child, childId++));
        }
    }
    
    return processedNode;
}

function generateSelector(node) {
    let selector = node.class;
    
    if (node['resource-id']) {
        selector += `[@resource-id="${node['resource-id']}"]`;
    } else if (node.text && node.text.length > 0) {
        // Escape special characters in text
        const escapedText = node.text.replace(/"/g, '\\"');
        selector += `[@text="${escapedText}"]`;
    } else if (node['content-desc'] && node['content-desc'].length > 0) {
        const escapedDesc = node['content-desc'].replace(/"/g, '\\"');
        selector += `[@content-desc="${escapedDesc}"]`;
    }
    
    if (node.index && node.index !== '0') {
        selector += `[${node.index}]`;
    }
    
    return selector;
}