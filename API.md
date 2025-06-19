# Droideer API Documentation

This document provides detailed API documentation for the Droideer library, a Puppeteer-like automation library for Android devices.

## Table of Contents

* [Droideer](#droideer)
* [AndroidDevice](#androiddevice)
* [Page](#page)
* [Element](#element)
* [Selector](#selector)
* [Gestures](#gestures)
* [NetworkMonitor](#networkmonitor)
* [Utilities](#utilities)

## Droideer

The main entry point for the library that provides static methods to connect to devices.

### Methods

#### `connect(deviceId = null)`

Connects to an Android device.

``` javascript
// Connect to the default device
const device = await Droideer.connect();

// Connect to a specific device by ID
const device = await Droideer.connect('emulator-5554');
```

**Parameters:**

* `deviceId` (string, optional): The ID of the device to connect to. If not provided, connects to the default device.

**Returns:** Promise - A connected device instance.
<br>
#### `launch(options = {})`

Launches an app and returns a device instance.

``` javascript
// Launch an app with default options
const device = await Droideer.launch({ app: 'com.android.settings' });

// Launch with all options
const device = await Droideer.launch({
  app: 'com.android.settings',
  deviceId: 'emulator-5554',
  timeout: 10000
});
```

**Parameters:**

* `options` (Object): Launch options
    * `app` (string): Package name of the app to launch
    * `deviceId` (string, optional): Device ID
    * `timeout` (number, optional): Launch timeout in milliseconds

**Returns:** Promise - Device instance with app launched.
<br>
#### `newPage(deviceId = null)`

Gets a new page instance for an already connected device.

``` javascript
const page = await Droideer.newPage();
```

**Parameters:**

* `deviceId` (string, optional): Device ID or null for default

**Returns:** Promise - Page instance.
<br>
## AndroidDevice

Represents a connected Android device.

### Methods

#### `launch(packageName)`

Launches an app on the device.

``` javascript
const page = await device.launch('com.android.settings');
```

**Parameters:**

* `packageName` (string): The package name of the app to launch.

**Returns:** Promise - The page instance for the launched app.
<br>
#### `getScreenSize()`

Gets the screen size of the device.

``` javascript
const screenSize = await device.getScreenSize();
console.log(`Width: ${screenSize.width}, Height: ${screenSize.height}`);
```

**Returns:** Promise