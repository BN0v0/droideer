import { Droideer } from '../src/index.js';
import { writeFileSync } from 'fs';

(async () => {
    console.log('⚡ Idealista Search & Scrape Test');

    try {
        // Initialize device and app
        const device = await Droideer.connect();
        const page = await device.launch('com.idealista.android');

        // Wait for app to fully load
        await page.waitForTimeout(1000);

        console.log('🔍 Looking for search element...');

        // Strategy 1: Try the original selector
        try {
            const categoryDropDown = await page.findByResourceId('com.idealista.android:id/propertyTypeSpinner');
            if (categoryDropDown) {
                await categoryDropDown.click();
                console.log('✅ Found and clicked property type dropdown');

                await page.waitForTimeout(1000);

                const newConstruction = await page.findByResourceId('com.idealista.android:id/spinner_main_newDevelopment');

                if (newConstruction) {
                    await newConstruction.click();
                    console.log('✅ Selected new construction option');

                    await page.waitForTimeout(1000);

                    const searchBtn = await page.findByResourceId('com.idealista.android:id/btSearch');

                    if (searchBtn) {
                        await searchBtn.click();
                        console.log('✅ Clicked search button');

                        // Wait for search results to load
                        await page.waitForTimeout(3000);

                        // Now start scraping the results
                        console.log('📋 Starting to collect property descriptions...');
                        const allDescriptions = await scrapeAllDescriptions(page);

                        // Save results
                        const outputData = {
                            timestamp: new Date().toISOString(),
                            app: 'Idealista',
                            searchType: 'New Construction',
                            totalProperties: allDescriptions.length,
                            descriptions: allDescriptions
                        };

                        writeFileSync('idealista-property-descriptions.json', JSON.stringify(outputData, null, 2));
                        console.log(`💾 Results saved to idealista-property-descriptions.json`);

                        // Display summary
                        console.log('\n📊 Scraping Results Summary:');
                        console.log(`Total Properties Found: ${allDescriptions.length}`);
                        
                        if (allDescriptions.length > 0) {
                            console.log('\n🏆 Sample Properties:');
                            allDescriptions.slice(0, 3).forEach((desc, i) => {
                                console.log(`${i + 1}. ${desc.text.substring(0, 80)}...`);
                                console.log(`   Unique ID: ${desc.id}`);
                                console.log('');
                            });
                        }

                    } else {
                        console.log('❌ Search button not found');
                    }
                } else {
                    console.log('❌ New construction option not found');
                }
            } else {
                console.log('❌ Property type dropdown not found');
            }

        } catch (error) {
            console.log('❌ Search process failed:', error.message);
        }

        await device.disconnect();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
})();

async function scrapeAllDescriptions(page) {
    const allDescriptions = new Set(); // Use Set to avoid duplicates
    let scrollCount = 0;
    const maxScrolls = 50; // Safety limit
    let consecutiveEmptyScrolls = 0;
    let lastDescriptionCount = 0;

    console.log('📄 Starting to scroll and collect descriptions...');

    while (scrollCount < maxScrolls) {
        scrollCount++;
        console.log(`📱 Processing scroll ${scrollCount}...`);

        // Find all description elements on current screen
        const currentDescriptions = await findDescriptionsOnScreen(page);
        
        let newCount = 0;
        for (const desc of currentDescriptions) {
            const uniqueId = generateUniqueId(desc);
            if (!hasDescription(allDescriptions, uniqueId)) {
                allDescriptions.add({
                    id: uniqueId,
                    text: desc.text,
                    resourceId: desc.resourceId,
                    bounds: desc.bounds,
                    scrollPosition: scrollCount
                });
                newCount++;
            }
        }

        console.log(`📈 Found ${newCount} new descriptions (total: ${allDescriptions.size})`);

        // Check if we should continue scrolling
        if (newCount === 0) {
            consecutiveEmptyScrolls++;
            console.log(`⚠️ No new descriptions found (${consecutiveEmptyScrolls}/3 empty scrolls)`);
            
            if (consecutiveEmptyScrolls >= 3) {
                console.log('🏁 No new descriptions found after 3 scrolls - stopping');
                break;
            }
        } else {
            consecutiveEmptyScrolls = 0;
        }

        // Check if we've reached the end by comparing description count
        if (allDescriptions.size === lastDescriptionCount && scrollCount > 5) {
            consecutiveEmptyScrolls++;
        }
        lastDescriptionCount = allDescriptions.size;

        // Scroll down to load more content
        console.log('📜 Scrolling down...');
        await page.scroll('up', 1000); // Scroll a good distance
        await page.waitForTimeout(1500); // Wait for content to load

        // Every 10 scrolls, try a longer scroll to make sure we're not stuck
        if (scrollCount % 10 === 0) {
            console.log('🚀 Performing long scroll to ensure progress...');
            await page.scroll('up', 1000);
            await page.waitForTimeout(2000);
        }
    }

    if (scrollCount >= maxScrolls) {
        console.log(`⚠️ Reached maximum scroll limit (${maxScrolls})`);
    }

    console.log(`✅ Scraping completed. Total scrolls: ${scrollCount}, Total descriptions: ${allDescriptions.size}`);
    
    // Convert Set to Array for return
    return Array.from(allDescriptions);
}

async function findDescriptionsOnScreen(page) {
    try {
        // Find all elements with the specific resource ID
        const descriptionElements = await page.findAllByResourceId('com.idealista.android:id/row_element');
        
        console.log(`🔍 Found ${descriptionElements.length} description elements on screen`);
        
        const descriptions = [];
        
        for (const element of descriptionElements) {
            try {
                // Extract text from the description element
                const text = await extractTextFromElement(element, page);
                
                if (text && text.trim().length > 10) { // Only include meaningful descriptions
                    descriptions.push({
                        text: text.trim(),
                        resourceId: element.resourceId,
                        bounds: element.bounds,
                        className: element.className
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Failed to extract text from description element: ${error.message}`);
            }
        }
        
        return descriptions;
        
    } catch (error) {
        console.warn(`⚠️ Failed to find description elements: ${error.message}`);
        return [];
    }
}

async function extractTextFromElement(element, page) {
    try {
        // Method 1: Try to get text directly from the element
        if (element.text && element.text.trim().length > 0) {
            return element.text;
        }

        // Method 2: Try to find text in child elements
        const allTextElements = await page.findElementsWithText();
        
        // Find text elements that are within the bounds of our description element
        const relevantTexts = [];
        
        if (element.boundsRect) {
            for (const textElement of allTextElements) {
                if (textElement.boundsRect && isElementWithinBounds(textElement.boundsRect, element.boundsRect)) {
                    if (textElement.text && textElement.text.trim().length > 0) {
                        relevantTexts.push(textElement.text.trim());
                    }
                }
            }
        }

        // Combine all relevant texts
        if (relevantTexts.length > 0) {
            return relevantTexts.join(' ').trim();
        }

        // Method 3: Try to get content description
        if (element.contentDesc && element.contentDesc.trim().length > 0) {
            return element.contentDesc;
        }

        return null;
        
    } catch (error) {
        console.warn(`Failed to extract text: ${error.message}`);
        return null;
    }
}

function isElementWithinBounds(childBounds, parentBounds) {
    try {
        return (
            childBounds.x1 >= parentBounds.x1 &&
            childBounds.y1 >= parentBounds.y1 &&
            childBounds.x2 <= parentBounds.x2 &&
            childBounds.y2 <= parentBounds.y2
        );
    } catch (error) {
        return false;
    }
}

function generateUniqueId(description) {
    // Create a unique ID based on text content and position
    const textHash = description.text.substring(0, 50).replace(/\s+/g, ' ').trim();
    const boundsHash = description.bounds || 'unknown-bounds';
    return `${textHash}-${boundsHash}`;
}

function hasDescription(descriptionsSet, uniqueId) {
    // Check if we already have this description
    for (const desc of descriptionsSet) {
        if (desc.id === uniqueId) {
            return true;
        }
    }
    return false;
}
