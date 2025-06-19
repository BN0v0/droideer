export class AndroidElement {
    constructor(device, data) {
        this.device = device;
        this._data = data;

        // Core properties with proper fallbacks
        this.id = data.id || 0;
        this.tag = data.tag || 'node';
        this.className = data.class || data.tag || 'android.view.View';
        this.resourceId = data['resource-id'] || '';
        this.text = data.text || '';
        this.contentDesc = data['content-desc'] || '';
        this.bounds = data.bounds || '[0,0][0,0]';
        this.index = data.index || '0';
        this.package = data.package || '';

        // Boolean properties
        this.isClickable = data.clickable === 'true';
        this.isLongClickable = data['long-clickable'] === 'true';
        this.isEnabled = data.enabled !== 'false'; // Default to true
        this.isSelected = data.selected === 'true';
        this.isFocused = data.focused === 'true';
        this.isFocusable = data.focusable === 'true';
        this.isScrollable = data.scrollable === 'true';
        this.isCheckable = data.checkable === 'true';
        this.isChecked = data.checked === 'true';
        this.isPassword = data.password === 'true';
        this.isVisibleToUser = data['visible-to-user'] !== 'false'; // Default to true

        // Parse bounds for easy access
        this.boundsRect = this._parseBounds(this.bounds);

        // Store all original data for debugging
        this.attributes = data.attributes || data;

        // Generate selector
        this.selector = data.selector || this._generateSelector();
    }

    _parseBounds(bounds) {
        if (!bounds) return null;

        const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (match) {
            const [, x1, y1, x2, y2] = match.map(Number);
            return {
                x1, y1, x2, y2,
                centerX: Math.floor((x1 + x2) / 2),
                centerY: Math.floor((y1 + y2) / 2),
                width: x2 - x1,
                height: y2 - y1
            };
        }
        return null;
    }

    _generateSelector() {
        let selector = this.className;

        if (this.resourceId) {
            selector += `[@resource-id="${this.resourceId}"]`;
        } else if (this.text && this.text.length > 0) {
            const escapedText = this.text.replace(/"/g, '\\"');
            selector += `[@text="${escapedText}"]`;
        } else if (this.contentDesc && this.contentDesc.length > 0) {
            const escapedDesc = this.contentDesc.replace(/"/g, '\\"');
            selector += `[@content-desc="${escapedDesc}"]`;
        }

        if (this.index && this.index !== '0') {
            selector += `[${this.index}]`;
        }

        return selector;
    }

    // Action methods
    async click() {
        if (!this.isClickable) {
            console.warn(`Element is not clickable: ${this.selector}`);
        }

        if (!this.boundsRect) {
            throw new Error('Cannot click element without valid bounds');
        }

        await this.device.adb.tap(this.boundsRect.centerX, this.boundsRect.centerY);
        await this.device.waitForIdle();
        return this;
    }

    async doubleClick() {
        if (!this.boundsRect) {
            throw new Error('Cannot double click element without valid bounds');
        }

        await this.device.adb.tap(this.boundsRect.centerX, this.boundsRect.centerY);
        await this.device.wait(100);
        await this.device.adb.tap(this.boundsRect.centerX, this.boundsRect.centerY);
        await this.device.waitForIdle();
        return this;
    }

    async longPress(duration = 1000) {
        if (!this.isLongClickable) {
            console.warn(`Element is not long-clickable: ${this.selector}`);
        }

        if (!this.boundsRect) {
            throw new Error('Cannot long press element without valid bounds');
        }

        await this.device.adb.swipe(
            this.boundsRect.centerX,
            this.boundsRect.centerY,
            this.boundsRect.centerX,
            this.boundsRect.centerY,
            duration
        );
        await this.device.waitForIdle();
        return this;
    }

    async type(text, options = {}) {
        // First click the element to focus it
        await this.click();
        await this.device.wait(100);

        // Clear existing text if requested
        if (options.clear !== false) {
            await this.clear();
        }

        // Type the text
        await this.device.adb.type(text);
        await this.device.waitForIdle();
        return this;
    }

    async clear() {
        await this.click();
        await this.device.wait(100);

        // Select all text and delete
        await this.device.adb.keyEvent(122); // CTRL+A equivalent
        await this.device.wait(50);
        await this.device.adb.keyEvent(67);  // DEL key
        await this.device.waitForIdle();
        return this;
    }

    async focus() {
        await this.click();
        return this;
    }

    async scrollIntoView() {
        // If element is not visible, try scrolling to find it
        if (!this.isVisible()) {
            // Try scrolling down first
            for (let i = 0; i < 5; i++) {
                await this.device.page.scroll('down');
                await this.device.wait(500);

                // Check if element is now visible (would need to refresh element data)
                // This is a simplified version - in practice, you'd need to re-query the element
                break;
            }
        }
        return this;
    }

    // State checking methods
    async isVisible() {
        if (!this.isVisibleToUser) return false;
        if (!this.boundsRect) return false;

        // Check if element has non-zero dimensions
        return this.boundsRect.width > 0 && this.boundsRect.height > 0;
    }

    async isDisplayed() {
        return this.isVisible();
    }

    async isEnabled() {
        return this.isEnabled;
    }

    async isSelected() {
        return this.isSelected;
    }

    async getAttribute(name) {
        // Map common attribute names to our properties
        const attributeMap = {
            'class': this.className,
            'className': this.className,
            'resource-id': this.resourceId,
            'resourceId': this.resourceId,
            'text': this.text,
            'content-desc': this.contentDesc,
            'contentDesc': this.contentDesc,
            'bounds': this.bounds,
            'clickable': this.isClickable.toString(),
            'enabled': this.isEnabled.toString(),
            'selected': this.isSelected.toString(),
            'focused': this.isFocused.toString(),
            'focusable': this.isFocusable.toString(),
            'scrollable': this.isScrollable.toString(),
            'checkable': this.isCheckable.toString(),
            'checked': this.isChecked.toString(),
            'long-clickable': this.isLongClickable.toString(),
            'password': this.isPassword.toString(),
            'visible-to-user': this.isVisibleToUser.toString(),
            'package': this.package,
            'index': this.index
        };

        return attributeMap[name] || this.attributes[name] || null;
    }

    async getText() {
        return this.text;
    }

    async getContentDesc() {
        return this.contentDesc;
    }

    async getResourceId() {
        return this.resourceId;
    }

    async getClassName() {
        return this.className;
    }

    async getBounds() {
        return this.boundsRect;
    }

    async getLocation() {
        return this.boundsRect ? {
            x: this.boundsRect.centerX,
            y: this.boundsRect.centerY
        } : null;
    }

    async getSize() {
        return this.boundsRect ? {
            width: this.boundsRect.width,
            height: this.boundsRect.height
        } : null;
    }

    async getRect() {
        return this.boundsRect;
    }

    // Utility methods
    toString() {
        const parts = [this.className];

        if (this.resourceId) {
            parts.push(`[@resource-id="${this.resourceId}"]`);
        }
        if (this.text) {
            parts.push(`[@text="${this.text.substring(0, 20)}${this.text.length > 20 ? '...' : ''}"]`);
        }
        if (this.contentDesc) {
            parts.push(`[@content-desc="${this.contentDesc.substring(0, 20)}${this.contentDesc.length > 20 ? '...' : ''}"]`);
        }

        return parts.join('');
    }

    // For debugging
    toJSON() {
        return {
            id: this.id,
            tag: this.tag,
            className: this.className,
            resourceId: this.resourceId,
            text: this.text,
            contentDesc: this.contentDesc,
            bounds: this.bounds,
            boundsRect: this.boundsRect,
            index: this.index,
            package: this.package,
            isClickable: this.isClickable,
            isEnabled: this.isEnabled,
            isVisible: this.isVisibleToUser,
            selector: this.selector,
            attributes: this.attributes
        };
    }

    // Advanced interaction methods
    async swipeLeft(distance) {
        if (!this.boundsRect) {
            throw new Error('Cannot swipe element without valid bounds');
        }

        const startX = this.boundsRect.centerX;
        const startY = this.boundsRect.centerY;
        const endX = Math.max(0, startX - (distance || this.boundsRect.width * 0.8));

        await this.device.adb.swipe(startX, startY, endX, startY, 300);
        await this.device.waitForIdle();
        return this;
    }

    async swipeRight(distance) {
        if (!this.boundsRect) {
            throw new Error('Cannot swipe element without valid bounds');
        }

        const screenSize = await this.device.getScreenSize();
        const startX = this.boundsRect.centerX;
        const startY = this.boundsRect.centerY;
        const endX = Math.min(screenSize.width, startX + (distance || this.boundsRect.width * 0.8));

        await this.device.adb.swipe(startX, startY, endX, startY, 300);
        await this.device.waitForIdle();
        return this;
    }

    async swipeUp(distance) {
        if (!this.boundsRect) {
            throw new Error('Cannot swipe element without valid bounds');
        }

        const startX = this.boundsRect.centerX;
        const startY = this.boundsRect.centerY;
        const endY = Math.max(0, startY - (distance || this.boundsRect.height * 0.8));

        await this.device.adb.swipe(startX, startY, startX, endY, 300);
        await this.device.waitForIdle();
        return this;
    }

    async swipeDown(distance) {
        if (!this.boundsRect) {
            throw new Error('Cannot swipe element without valid bounds');
        }

        const screenSize = await this.device.getScreenSize();
        const startX = this.boundsRect.centerX;
        const startY = this.boundsRect.centerY;
        const endY = Math.min(screenSize.height, startY + (distance || this.boundsRect.height * 0.8));

        await this.device.adb.swipe(startX, startY, startX, endY, 300);
        await this.device.waitForIdle();
        return this;
    }

    // Scroll methods for scrollable elements
    async scrollToTop() {
        if (!this.isScrollable) {
            console.warn(`Element is not scrollable: ${this.selector}`);
            return this;
        }

        // Perform multiple upward swipes
        for (let i = 0; i < 10; i++) {
            await this.swipeUp();
            await this.device.wait(200);
        }
        return this;
    }

    async scrollToBottom() {
        if (!this.isScrollable) {
            console.warn(`Element is not scrollable: ${this.selector}`);
            return this;
        }

        // Perform multiple downward swipes
        for (let i = 0; i < 10; i++) {
            await this.swipeDown();
            await this.device.wait(200);
        }
        return this;
    }

    // Check if element matches a selector
    matches(selector) {
        if (typeof selector === 'string') {
            // Simple string matching
            if (selector.startsWith('#')) {
                const id = selector.substring(1);
                return this.resourceId === id || this.resourceId.endsWith(`:id/${id}`);
            }
            if (selector.startsWith('.')) {
                const className = selector.substring(1);
                return this.className.includes(className);
            }
            return this.text === selector || this.contentDesc === selector;
        }

        if (typeof selector === 'object') {
            // Object selector matching
            for (const [key, value] of Object.entries(selector)) {
                switch (key) {
                    case 'resourceId':
                    case 'id':
                        if (this.resourceId !== value && !this.resourceId.endsWith(`:id/${value}`)) {
                            return false;
                        }
                        break;
                    case 'text':
                        if (value instanceof RegExp) {
                            if (!value.test(this.text)) return false;
                        } else if (this.text !== value) return false;
                        break;
                    case 'contains':
                    case 'textContains':
                        if (!this.text.toLowerCase().includes(value.toLowerCase()) &&
                            !this.contentDesc.toLowerCase().includes(value.toLowerCase())) {
                            return false;
                        }
                        break;
                    case 'className':
                    case 'class':
                        if (value instanceof RegExp) {
                            if (!value.test(this.className)) return false;
                        } else if (this.className !== value) return false;
                        break;
                    case 'contentDesc':
                    case 'description':
                        if (value instanceof RegExp) {
                            if (!value.test(this.contentDesc)) return false;
                        } else if (this.contentDesc !== value) return false;
                        break;
                    case 'clickable':
                        if (this.isClickable !== Boolean(value)) return false;
                        break;
                    case 'enabled':
                        if (this.isEnabled !== Boolean(value)) return false;
                        break;
                    default:
                        if (this.attributes[key] !== value) return false;
                }
            }
            return true;
        }

        return false;
    }
}