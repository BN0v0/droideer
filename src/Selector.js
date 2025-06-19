import { AndroidElement } from './Element.js';

export class Selector {
    constructor(device) {
        this.device = device;
    }

    // Main selector methods (Puppeteer-like interface)
    async $(selector) {
        return this.findElement(selector);
    }

    async $$(selector) {
        return this.findElements(selector);
    }

    async $eval(selector, pageFunction, ...args) {
        const element = await this.findElement(selector);
        if (!element) {
            throw new Error(`Element not found: ${JSON.stringify(selector)}`);
        }
        return pageFunction(element, ...args);
    }

    async $$eval(selector, pageFunction, ...args) {
        const elements = await this.findElements(selector);
        return pageFunction(elements, ...args);
    }

    // Core finding methods
    async findElement(selector) {
        const elements = await this.findElements(selector);
        return elements.length > 0 ? elements[0] : null;
    }

    async findElements(selector) {
        const uiHierarchy = await this.device.getUIHierarchy();
        const elements = this._searchElements(uiHierarchy, selector);
        return elements.map(data => new AndroidElement(this.device, data));
    }

    // Specialized finder methods for better API
    async findElementByResourceId(resourceId) {
        return this.findElement({ resourceId });
    }

    async findElementsByResourceId(resourceId) {
        return this.findElements({ resourceId });
    }

    async findElementByText(text, exact = true) {
        return this.findElement(exact ? { text } : { contains: text });
    }

    async findElementsByText(text, exact = true) {
        return this.findElements(exact ? { text } : { contains: text });
    }

    async findElementByContentDesc(description, exact = true) {
        return this.findElement(exact ? { contentDesc: description } : { contentDesc: new RegExp(description, 'i') });
    }

    async findElementsByContentDesc(description, exact = true) {
        return this.findElements(exact ? { contentDesc: description } : { contentDesc: new RegExp(description, 'i') });
    }

    async findElementByClassName(className) {
        return this.findElement({ className });
    }

    async findElementsByClassName(className) {
        return this.findElements({ className });
    }

    async findClickableElements() {
        return this.findElements({ clickable: true });
    }

    async findScrollableElements() {
        return this.findElements({ scrollable: true });
    }

    async findElementsWithText() {
        const uiHierarchy = await this.device.getUIHierarchy();
        const elements = this._findElementsWithTextRecursive(uiHierarchy);
        return elements.map(data => new AndroidElement(this.device, data));
    }

    // XPath support
    async findByXPath(xpath) {
        const uiHierarchy = await this.device.getUIHierarchy();
        const elements = this._evaluateXPath(uiHierarchy, xpath);
        return elements.map(data => new AndroidElement(this.device, data));
    }

    async $x(xpath) {
        return this.findByXPath(xpath);
    }

    // Private methods for element searching
    _searchElements(node, selector, results = []) {
        if (this._matchesSelector(node, selector)) {
            results.push(node);
        }

        if (node.children) {
            for (const child of node.children) {
                this._searchElements(child, selector, results);
            }
        }

        return results;
    }

    _matchesSelector(node, selector) {
        // Handle different selector types
        if (typeof selector === 'string') {
            return this._matchStringSelector(node, selector);
        }
        
        if (typeof selector === 'object') {
            return this._matchObjectSelector(node, selector);
        }

        return false;
    }

    _matchStringSelector(node, selector) {
        // CSS-like selectors
        if (selector.startsWith('#')) {
            // ID selector (resource-id)
            const id = selector.substring(1);
            return node['resource-id'] === id || node['resource-id']?.endsWith(`:id/${id}`);
        }
        
        if (selector.startsWith('.')) {
            // Class selector
            const className = selector.substring(1);
            return node.class && node.class.includes(className);
        }
        
        if (selector.startsWith('[') && selector.endsWith(']')) {
            // Attribute selector [attribute=value]
            const attrMatch = selector.match(/\[([^=]+)=["']?([^"'\]]+)["']?\]/);
            if (attrMatch) {
                const [, attr, value] = attrMatch;
                return node[attr] === value;
            }
            
            // Attribute contains selector [attribute*=value]
            const containsMatch = selector.match(/\[([^*]+)\*=["']?([^"'\]]+)["']?\]/);
            if (containsMatch) {
                const [, attr, value] = containsMatch;
                return node[attr] && node[attr].includes(value);
            }
            
            // Attribute exists selector [attribute]
            const attrExistsMatch = selector.match(/\[([^=\]]+)\]/);
            if (attrExistsMatch) {
                return node[attrExistsMatch[1]] !== undefined;
            }
        }
        
        // Element selector (class name)
        if (selector.includes('.')) {
            return node.class === selector;
        }
        
        // Text content exact match
        return node.text === selector || node['content-desc'] === selector;
    }

    _matchObjectSelector(node, selector) {
        for (const [key, value] of Object.entries(selector)) {
            switch (key) {
                case 'text':
                    if (value instanceof RegExp) {
                        if (!value.test(node.text || '')) return false;
                    } else if (node.text !== value) return false;
                    break;
                    
                case 'textContains':
                case 'contains':
                    const searchText = value.toLowerCase();
                    const nodeText = (node.text || '').toLowerCase();
                    const nodeDesc = (node['content-desc'] || '').toLowerCase();
                    if (!nodeText.includes(searchText) && !nodeDesc.includes(searchText)) {
                        return false;
                    }
                    break;

                case 'textMatches':
                    const regex = new RegExp(value, 'i');
                    if (!regex.test(node.text || '') && !regex.test(node['content-desc'] || '')) {
                        return false;
                    }
                    break;
                    
                case 'resourceId':
                case 'id':
                    if (typeof value === 'string') {
                        // Support both full resource ID and short form
                        if (node['resource-id'] !== value && !node['resource-id']?.endsWith(`:id/${value}`)) {
                            return false;
                        }
                    } else if (value instanceof RegExp) {
                        if (!value.test(node['resource-id'] || '')) return false;
                    }
                    break;
                    
                case 'className':
                case 'class':
                    if (value instanceof RegExp) {
                        if (!value.test(node.class || '')) return false;
                    } else if (node.class !== value) return false;
                    break;
                    
                case 'contentDesc':
                case 'description':
                    if (value instanceof RegExp) {
                        if (!value.test(node['content-desc'] || '')) return false;
                    } else if (node['content-desc'] !== value) return false;
                    break;
                    
                case 'clickable':
                    if (node.clickable !== String(value)) return false;
                    break;
                    
                case 'enabled':
                    if (node.enabled !== String(value)) return false;
                    break;
                    
                case 'selected':
                    if (node.selected !== String(value)) return false;
                    break;
                    
                case 'checked':
                    if (node.checked !== String(value)) return false;
                    break;

                case 'scrollable':
                    if (node.scrollable !== String(value)) return false;
                    break;

                case 'focusable':
                    if (node.focusable !== String(value)) return false;
                    break;

                case 'focused':
                    if (node.focused !== String(value)) return false;
                    break;
                    
                case 'index':
                    if (node.index !== String(value)) return false;
                    break;
                    
                case 'bounds':
                    // Match bounds pattern
                    if (node.bounds !== value) return false;
                    break;

                case 'package':
                    if (node.package !== value) return false;
                    break;
                    
                default:
                    if (node[key] !== value) return false;
            }
        }
        return true;
    }

    // XPath evaluation methods
    _evaluateXPath(node, xpath) {
        const results = [];
        
        if (xpath === '//*') {
            // All elements
            this._getAllElements(node, results);
        } else if (xpath.startsWith('//')) {
            // Descendant search
            const remaining = xpath.substring(2);
            this._evaluateDescendantPath(node, remaining, results);
        } else if (xpath.startsWith('/')) {
            // Direct child search
            const remaining = xpath.substring(1);
            this._evaluateChildPath(node, remaining, results);
        }
        
        return results;
    }

    _evaluateDescendantPath(node, path, results) {
        const parts = path.split('[');
        const elementName = parts[0];
        const predicate = parts[1] ? parts[1].replace(']', '') : null;

        this._findByElementName(node, elementName, results, predicate);
    }

    _evaluateChildPath(node, path, results) {
        const parts = path.split('[');
        const elementName = parts[0];
        const predicate = parts[1] ? parts[1].replace(']', '') : null;

        if (node.children) {
            for (const child of node.children) {
                if (this._matchesXPathElement(child, elementName, predicate)) {
                    results.push(child);
                }
            }
        }
    }

    _findByElementName(node, elementName, results, predicate = null) {
        if (this._matchesXPathElement(node, elementName, predicate)) {
            results.push(node);
        }
        
        if (node.children) {
            for (const child of node.children) {
                this._findByElementName(child, elementName, results, predicate);
            }
        }
    }

    _matchesXPathElement(node, elementName, predicate) {
        // Check element name (class)
        if (elementName !== '*' && !node.class?.includes(elementName)) {
            return false;
        }

        // Check predicate
        if (predicate) {
            return this._evaluatePredicate(node, predicate);
        }

        return true;
    }

    _evaluatePredicate(node, predicate) {
        // Simple predicate evaluation
        if (predicate.includes('@text=')) {
            const textMatch = predicate.match(/@text=['"]([^'"]+)['"]/);
            if (textMatch) {
                return node.text === textMatch[1];
            }
        }

        if (predicate.includes('@resource-id=')) {
            const idMatch = predicate.match(/@resource-id=['"]([^'"]+)['"]/);
            if (idMatch) {
                return node['resource-id'] === idMatch[1];
            }
        }

        if (predicate.includes('@content-desc=')) {
            const descMatch = predicate.match(/@content-desc=['"]([^'"]+)['"]/);
            if (descMatch) {
                return node['content-desc'] === descMatch[1];
            }
        }

        if (predicate.includes('@clickable=')) {
            const clickableMatch = predicate.match(/@clickable=['"]([^'"]+)['"]/);
            if (clickableMatch) {
                return node.clickable === clickableMatch[1];
            }
        }

        // Position predicates
        if (/^\d+$/.test(predicate)) {
            // Index predicate [1], [2], etc.
            const index = parseInt(predicate) - 1; // XPath is 1-indexed
            return node.index === String(index);
        }

        return false;
    }

    _getAllElements(node, results) {
        results.push(node);
        if (node.children) {
            for (const child of node.children) {
                this._getAllElements(child, results);
            }
        }
    }

    _findElementsWithTextRecursive(node, results = []) {
        if (node.text && node.text.trim().length > 0) {
            results.push(node);
        }
        
        if (node.children) {
            for (const child of node.children) {
                this._findElementsWithTextRecursive(child, results);
            }
        }
        
        return results;
    }
}