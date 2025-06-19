import { Selector } from './Selector.js';
import { Gestures } from './Gestures.js';

export class Page {
    constructor(device) {
        this.device = device;
        this.selector = new Selector(device);
        this.gestures = new Gestures(device);
        this._viewport = null;
    }

    // Primary selector methods (Puppeteer-like interface)
    async $(selector) {
        return this.selector.$(selector);
    }

    async $$(selector) {
        return this.selector.$$(selector);
    }

    async $eval(selector, pageFunction, ...args) {
        return this.selector.$eval(selector, pageFunction, ...args);
    }

    async $$eval(selector, pageFunction, ...args) {
        return this.selector.$$eval(selector, pageFunction, ...args);
    }

    async $x(xpath) {
        return this.selector.findByXPath(xpath);
    }

    // Enhanced selector methods with better API
    async findByResourceId(resourceId) {
        return this.selector.findElementByResourceId(resourceId);
    }

    async findAllByResourceId(resourceId) {
        return this.selector.findElementsByResourceId(resourceId);
    }

    async findByText(text, exact = true) {
        return this.selector.findElementByText(text, exact);
    }

    async findAllByText(text, exact = true) {
        return this.selector.findElementsByText(text, exact);
    }

    async findByContentDesc(description, exact = true) {
        return this.selector.findElementByContentDesc(description, exact);
    }

    async findAllByContentDesc(description, exact = true) {
        return this.selector.findElementsByContentDesc(description, exact);
    }

    async findByClassName(className) {
        return this.selector.findElementByClassName(className);
    }

    async findAllByClassName(className) {
        return this.selector.findElementsByClassName(className);
    }

    async findClickableElements() {
        return this.selector.findClickableElements();
    }

    async findScrollableElements() {
        return this.selector.findScrollableElements();
    }

    async findElementsWithText() {
        return this.selector.findElementsWithText();
    }

    // Wait methods
    async waitForSelector(selector, options = {}) {
        const timeout = options.timeout || 30000;
        const visible = options.visible !== false;
        const hidden = options.hidden === true;
        
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const element = await this.$(selector);
                if (element) {
                    if (hidden) {
                        if (!(await element.isVisible())) {
                            return element;
                        }
                    } else if (!visible || await element.isVisible()) {
                        return element;
                    }
                }
            } catch (error) {
                // Continue waiting
            }
            
            await this.device.wait(100);
            // Refresh UI hierarchy periodically
            if ((Date.now() - startTime) % 2000 < 100) {
                await this.device.getUIHierarchy(true);
            }
        }
        
        throw new Error(`Selector "${JSON.stringify(selector)}" not found after ${timeout}ms`);
    }

    async waitForText(text, options = {}) {
        const timeout = options.timeout || 30000;
        const exact = options.exact !== false;
        
        const selector = exact ? { text } : { contains: text };
        return this.waitForSelector(selector, { timeout });
    }

    async waitForResourceId(resourceId, options = {}) {
        const timeout = options.timeout || 30000;
        const selector = { resourceId };
        return this.waitForSelector(selector, { timeout });
    }

    async waitForFunction(pageFunction, options = {}, ...args) {
        const timeout = options.timeout || 30000;
        const polling = options.polling || 100;
        
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const result = await this.evaluate(pageFunction, ...args);
                if (result) {
                    return result;
                }
            } catch (error) {
                // Continue waiting
            }
            await this.device.wait(polling);
        }
        
        throw new Error(`Function did not return truthy value after ${timeout}ms`);
    }

    async waitForNavigation(options = {}) {
        const timeout = options.timeout || 5000;
        const currentActivity = await this.device.adb.getCurrentActivity();
        
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const newActivity = await this.device.adb.getCurrentActivity();
            if (JSON.stringify(newActivity) !== JSON.stringify(currentActivity)) {
                await this.device.waitForIdle();
                return;
            }
            await this.device.wait(100);
        }
        
        throw new Error(`Navigation timeout after ${timeout}ms`);
    }

    async waitForTimeout(ms) {
        await this.device.wait(ms);
    }

    // Interaction methods
    async click(selector, options = {}) {
        const element = await this.waitForSelector(selector, options);
        return element.click();
    }

    async clickByResourceId(resourceId, options = {}) {
        return this.click({ resourceId }, options);
    }

    async clickByText(text, options = {}) {
        return this.click({ text }, options);
    }

    async doubleClick(selector, options = {}) {
        const element = await this.waitForSelector(selector, options);
        return element.doubleClick();
    }

    async type(selector, text, options = {}) {
        const element = await this.waitForSelector(selector, options);
        return element.type(text, options);
    }

    async typeByResourceId(resourceId, text, options = {}) {
        return this.type({ resourceId }, text, options);
    }

    async clear(selector) {
        const element = await this.waitForSelector(selector);
        return element.clear();
    }

    async clearByResourceId(resourceId) {
        return this.clear({ resourceId });
    }

    async focus(selector) {
        const element = await this.waitForSelector(selector);
        return element.click(); // Focus by clicking
    }

    async hover(selector) {
        // Android doesn't have hover, but we can simulate with touch
        const element = await this.waitForSelector(selector);
        const bounds = element.bounds;
        if (bounds) {
            // Just position over the element (visual feedback only)
            console.log(`Hovering over element at (${bounds.centerX}, ${bounds.centerY})`);
        }
        return element;
    }

    // Gesture methods
    async tap(x, y) {
        return this.gestures.tap(x, y);
    }

    async longPress(x, y, duration = 1000) {
        return this.gestures.longPress(x, y, duration);
    }

    async swipe(startX, startY, endX, endY, duration = 300) {
        return this.gestures.swipe(startX, startY, endX, endY, duration);
    }

    async scroll(direction = 'down', distance = 500) {
        return this.gestures.scroll(direction, distance);
    }

    async fling(direction = 'down', velocity = 'fast') {
        return this.gestures.fling(direction, velocity);
    }

    async dragAndDrop(fromSelector, toSelector, options = {}) {
        const fromElement = await this.waitForSelector(fromSelector);
        const toElement = await this.waitForSelector(toSelector);
        return this.gestures.dragAndDrop(fromElement, toElement, options.duration);
    }

    // Navigation
    async goBack() {
        await this.device.adb.back();
        await this.device.waitForIdle();
    }

    async goHome() {
        await this.device.adb.home();
        await this.device.waitForIdle();
    }

    async goToRecentApps() {
        await this.device.adb.recentApps();
        await this.device.waitForIdle();
    }

    async reload() {
        // Pull down to refresh gesture
        const screenSize = await this.device.getScreenSize();
        await this.gestures.swipe(
            screenSize.width / 2, 
            screenSize.height * 0.3,
            screenSize.width / 2, 
            screenSize.height * 0.7,
            1000
        );
        await this.device.waitForIdle();
    }

    async refresh() {
        return this.reload();
    }

    // Information methods
    async title() {
        const activity = await this.device.getCurrentApp();
        return activity ? `${activity.package}/${activity.activity}` : 'Unknown';
    }

    async url() {
        return this.title(); // Android doesn't have URLs like web
    }

    async content() {
        const uiHierarchy = await this.device.getUIHierarchy();
        return JSON.stringify(uiHierarchy, null, 2);
    }

    // Viewport and screenshots
    async setViewport(viewport) {
        this._viewport = viewport;
        // Android doesn't support changing viewport like web browsers
        console.warn('setViewport is not supported on Android devices');
    }

    async viewport() {
        if (!this._viewport) {
            const screenSize = await this.device.getScreenSize();
            this._viewport = {
                width: screenSize.width,
                height: screenSize.height,
                deviceScaleFactor: 1,
                isMobile: true,
                hasTouch: true,
                isLandscape: screenSize.width > screenSize.height
            };
        }
        return this._viewport;
    }

    async screenshot(options = {}) {
        const path = options.path || `screenshot-${Date.now()}.png`;
        await this.device.screenshot(path);
        
        if (options.fullPage) {
            console.warn('fullPage screenshots not supported - captured visible area only');
        }
        
        return path;
    }

    // Evaluation
    async evaluate(pageFunction, ...args) {
        const uiHierarchy = await this.device.getUIHierarchy();
        return pageFunction(uiHierarchy, ...args);
    }

    async evaluateHandle(pageFunction, ...args) {
        const result = await this.evaluate(pageFunction, ...args);
        return { asElement: () => null, jsonValue: () => result };
    }

    // Advanced interaction methods
    async sendKeys(keys) {
        for (const key of keys) {
            if (typeof key === 'string') {
                await this.device.adb.type(key);
            } else if (typeof key === 'number') {
                await this.device.adb.keyEvent(key);
            }
            await this.device.wait(50);
        }
        await this.device.waitForIdle();
    }

    async pressKey(keyCode) {
        await this.device.adb.keyEvent(keyCode);
        await this.device.waitForIdle();
    }

    // Android-specific methods
    async pullToRefresh() {
        return this.gestures.pullToRefresh();
    }

    async openNotificationPanel() {
        const screenSize = await this.device.getScreenSize();
        await this.gestures.swipe(
            screenSize.width / 2, 0,
            screenSize.width / 2, screenSize.height / 2,
            500
        );
    }

    async openQuickSettings() {
        const screenSize = await this.device.getScreenSize();
        await this.gestures.swipe(
            screenSize.width / 2, 0,
            screenSize.width / 2, screenSize.height / 2,
            500
        );
        // Swipe down again for quick settings
        await this.device.wait(500);
        await this.gestures.swipe(
            screenSize.width / 2, screenSize.height * 0.3,
            screenSize.width / 2, screenSize.height * 0.7,
            500
        );
    }

    async rotate(orientation = 'landscape') {
        // This requires shell commands and device cooperation
        const orientationMap = {
            'portrait': 0,
            'landscape': 1,
            'reverse-portrait': 2,
            'reverse-landscape': 3
        };
        
        const value = orientationMap[orientation];
        if (value !== undefined) {
            await this.device.adb.shell(`settings put system user_rotation ${value}`);
            await this.device.waitForIdle();
        }
    }

    async setOrientation(orientation) {
        return this.rotate(orientation);
    }

    // Text and element utilities
    async getText(selector) {
        const element = await this.$(selector);
        return element ? element.text : null;
    }

    async getTextByResourceId(resourceId) {
        return this.getText({ resourceId });
    }

    async getAllText() {
        const elements = await this.selector.findElementsWithText();
        return elements.map(el => el.text).filter(text => text.trim().length > 0);
    }

    async isElementVisible(selector) {
        const element = await this.$(selector);
        return element ? element.isVisible() : false;
    }

    async isElementEnabled(selector) {
        const element = await this.$(selector);
        return element ? element.isEnabled : false;
    }

    async getElementCount(selector) {
        const elements = await this.$$(selector);
        return elements.length;
    }

    // Utility methods
    async close() {
        await this.device.close();
    }

    async isClosed() {
        try {
            await this.device.getCurrentApp();
            return false;
        } catch (error) {
            return true;
        }
    }

    // Scrolling utilities
    async scrollToElement(selector, maxScrolls = 10) {
        for (let i = 0; i < maxScrolls; i++) {
            const element = await this.$(selector);
            if (element && await element.isVisible()) {
                return element;
            }
            await this.scroll('down');
            await this.device.wait(500);
        }
        throw new Error(`Element ${JSON.stringify(selector)} not found after ${maxScrolls} scrolls`);
    }

    async scrollToElementByResourceId(resourceId, maxScrolls = 10) {
        return this.scrollToElement({ resourceId }, maxScrolls);
    }

    async scrollToText(text, maxScrolls = 10) {
        return this.scrollToElement({ text }, maxScrolls);
    }

    async scrollToTop() {
        return this.gestures.scrollToTop();
    }

    async scrollToBottom() {
        return this.gestures.scrollToBottom();
    }
}