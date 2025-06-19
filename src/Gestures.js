export class Gestures {
    constructor(device) {
        this.device = device;
    }

    async tap(x, y) {
        await this.device.adb.tap(x, y);
        await this.device.waitForIdle();
        return this;
    }

    async doubleTap(x, y, delay = 100) {
        await this.tap(x, y);
        await this.device.wait(delay);
        await this.tap(x, y);
        return this;
    }

    async longPress(x, y, duration = 1000) {
        // Simulate long press with swipe of 0 distance
        await this.device.adb.swipe(x, y, x, y, duration);
        await this.device.waitForIdle();
        return this;
    }

    async swipe(startX, startY, endX, endY, duration = 300) {
        await this.device.adb.swipe(startX, startY, endX, endY, duration);
        await this.device.waitForIdle();
        return this;
    }

    async scroll(direction = 'down', distance = 500, duration = 300) {
        const screenSize = await this.device.getScreenSize();
        const centerX = screenSize.width / 2;
        const centerY = screenSize.height / 2;

        let startX = centerX;
        let startY = centerY;
        let endX = centerX;
        let endY = centerY;

        switch (direction.toLowerCase()) {
            case 'up':
                startY = centerY + distance / 2;
                endY = centerY - distance / 2;
                break;
            case 'down':
                startY = centerY - distance / 2;
                endY = centerY + distance / 2;
                break;
            case 'left':
                startX = centerX + distance / 2;
                endX = centerX - distance / 2;
                break;
            case 'right':
                startX = centerX - distance / 2;
                endX = centerX + distance / 2;
                break;
            default:
                throw new Error('Invalid scroll direction. Use: up, down, left, right');
        }

        await this.swipe(startX, startY, endX, endY, duration);
        return this;
    }

    async scrollToTop(maxScrolls = 10) {
        for (let i = 0; i < maxScrolls; i++) {
            await this.scroll('up');
            await this.device.wait(300);
        }
        return this;
    }

    async scrollToBottom(maxScrolls = 10) {
        for (let i = 0; i < maxScrolls; i++) {
            await this.scroll('down');
            await this.device.wait(300);
        }
        return this;
    }

    async fling(direction = 'down', velocity = 'fast') {
        const screenSize = await this.device.getScreenSize();
        const centerX = screenSize.width / 2;
        const centerY = screenSize.height / 2;
        
        // Adjust distance and duration based on velocity
        let distance, duration;
        switch (velocity) {
            case 'slow':
                distance = 300;
                duration = 600;
                break;
            case 'medium':
                distance = 500;
                duration = 400;
                break;
            case 'fast':
            default:
                distance = 800;
                duration = 200;
                break;
        }

        let startX = centerX;
        let startY = centerY;
        let endX = centerX;
        let endY = centerY;

        switch (direction.toLowerCase()) {
            case 'up':
                startY = centerY + distance / 2;
                endY = centerY - distance / 2;
                break;
            case 'down':
                startY = centerY - distance / 2;
                endY = centerY + distance / 2;
                break;
            case 'left':
                startX = centerX + distance / 2;
                endX = centerX - distance / 2;
                break;
            case 'right':
                startX = centerX - distance / 2;
                endX = centerX + distance / 2;
                break;
        }

        await this.swipe(startX, startY, endX, endY, duration);
        return this;
    }

    async pinch(centerX, centerY, scale = 0.5, duration = 500) {
        // Simulate pinch gesture (zoom out)
        const distance = 100;
        const finger1StartX = centerX - distance;
        const finger1StartY = centerY;
        const finger1EndX = centerX - distance * scale;
        const finger1EndY = centerY;
        
        const finger2StartX = centerX + distance;
        const finger2StartY = centerY;
        const finger2EndX = centerX + distance * scale;
        const finger2EndY = centerY;

        // Note: This is simplified - real pinch would need multi-touch
        // For now, we'll do sequential swipes
        await this.swipe(finger1StartX, finger1StartY, finger1EndX, finger1EndY, duration);
        await this.device.wait(50);
        await this.swipe(finger2StartX, finger2StartY, finger2EndX, finger2EndY, duration);
        
        return this;
    }

    async zoom(centerX, centerY, scale = 2.0, duration = 500) {
        // Simulate zoom gesture (opposite of pinch)
        const distance = 50;
        const finger1StartX = centerX - distance;
        const finger1StartY = centerY;
        const finger1EndX = centerX - distance * scale;
        const finger1EndY = centerY;
        
        const finger2StartX = centerX + distance;
        const finger2StartY = centerY;
        const finger2EndX = centerX + distance * scale;
        const finger2EndY = centerY;

        await this.swipe(finger1StartX, finger1StartY, finger1EndX, finger1EndY, duration);
        await this.device.wait(50);
        await this.swipe(finger2StartX, finger2StartY, finger2EndX, finger2EndY, duration);
        
        return this;
    }

    async drag(fromX, fromY, toX, toY, duration = 1000) {
        await this.device.adb.swipe(fromX, fromY, toX, toY, duration);
        await this.device.waitForIdle();
        return this;
    }

};