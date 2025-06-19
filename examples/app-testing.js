import {Droideer} from '../src/index.js';

(async () => {
    const device = await Droideer.connect();
    
    try {
        // Launch Instagram
        const page = await device.launch('com.instagram.android');
        
        // Wait for login screen
        const loginButton = await page.waitForSelector({ 
            resourceId: 'com.instagram.android:id/log_in_button' 
        });
        
        // Fill username
        await page.type({ 
            resourceId: 'com.instagram.android:id/login_username' 
        }, 'your_username');
        
        // Fill password
        await page.type({ 
            resourceId: 'com.instagram.android:id/password' 
        }, 'your_password');
        
        // Click login
        await loginButton.click();
        
        // Wait for navigation
        await page.waitForNavigation();
        
        // Search for something
        const searchTab = await page.waitForSelector({ 
            contentDesc: 'Search and Explore' 
        });
        await searchTab.click();
        
        // Type in search
        const searchBox = await page.waitForSelector({ 
            resourceId: 'com.instagram.android:id/action_bar_search_edit_text' 
        });
        await searchBox.type('cats');
        
        // Wait for results
        await page.wait(2000);
        
        // Take screenshot of results
        await page.screenshot('instagram-search.png');
        
    } catch (error) {
        console.error('Automation failed:', error);
    } finally {
        await device.disconnect();
    }
})();