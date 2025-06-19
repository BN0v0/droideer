export class DroideerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DroideerError';
    }
}

export class ElementNotFoundError extends DroideerError {
    constructor(selector) {
        super(`Element not found: ${JSON.stringify(selector)}`);
        this.name = 'ElementNotFoundError';
    }
}

export class TimeoutError extends DroideerError {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class DeviceNotConnectedError extends DroideerError {
    constructor() {
        super('Android device not connected or ADB not available');
        this.name = 'DeviceNotConnectedError';
    }
}
