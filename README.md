# Droideer 🤖📱

![Droideer Logo](https://img.shields.io/badge/Droideer-Android%20Automation-green?style=for-the-badge&logo=android)

**Puppeteer-like API for Android automation** \- Control Android devices with familiar web automation syntax for testing\, scraping\, and automation

[![npm version](https://img.shields.io/npm/v/droideer?style=flat-square)](https://npmjs.com/package/droideer)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Android](https://img.shields.io/badge/Android-7%2B-green?style=flat-square&logo=android)](https://developer.android.com/)
[![WIP](https://img.shields.io/badge/Status-Work%20In%20Progress-yellow?style=flat-square)](https://github.com/your-repo/droideer)

- - -

> ⚠️ **Work In Progress**: This repository is currently under active development. Features and APIs may change. Emulator support is in testing phase.

## 🚀 What is Droideer?

Droideer brings the beloved Puppeteer API to Android automation. Whether you're testing apps, scraping mobile data, or automating workflows, if you've ever automated web browsers, you'll feel right at home automating Android apps!

Perfect for:

* 🧪 **End-to-end testing** of Android applications
* 📊 **Data scraping** from mobile apps and services
* 🤖 **Workflow automation** and repetitive task automation
* 🔍 **App behavior analysis** and reverse engineering
* 📱 **Cross-platform testing** across different Android devices

## 🔧 Android DevTools Companion

Note: For a visual UI inspector and debugging experience similar to Chrome DevTools, check out our companion repository:
[Droideer Inspection Tools](https://github.com/BN0v0/droideer-inpection-tools) 🛠️

## ✨ Features

### Core Automation

* 🎯 **Puppeteer-like API** \- Familiar syntax for web developers
* 🔍 **Smart Element Finding** \- Multiple selector strategies \(text\, ID\, class\, contains\)
* 📱 **Real Device Control** \- Direct ADB integration for authentic interactions
* 🤹 **Rich Gestures** \- Tap\, swipe\, scroll\, long press\, drag & drop
* ⏰ **Auto-waiting** \- Built\-in waits for UI stability and element appearance

### Testing & Debugging

* 📸 **Screenshot Support** \- Visual debugging and test verification
* 🔄 **App Management** \- Launch\, close\, and manage Android applications
* 🧩 **Element Properties** \- Access all element attributes and properties
* 📋 **UI Hierarchy Inspection** \- Comprehensive element tree analysis

### Advanced Features

* 🌐 **Network Monitoring** \- Track HTTP requests and API calls during automation
* 🎯 **Domain-Specific Filtering** \- Monitor only relevant network traffic
* 📊 **Response Capture** \- Extract JSON responses and API data
* 🔧 **Reverse Engineering** \- Analyze app behavior and API endpoints

### Scraping Capabilities

* 📱 **Mobile App Scraping** \- Extract data from native Android applications
* 🔄 **Infinite Scroll Handling** \- Automatically handle pagination and lazy loading
* 📊 **Structured Data Extraction** \- Extract listings\, properties\, products\, and more
* 🎯 **Element-Specific Targeting** \- Precise data extraction using resource IDs and selectors
* 💾 **Export Support** \- Save scraped data in JSON\, CSV\, or custom formats

## 📦 Installation

``` bash
npm install droideer
```

### Prerequisites

1. **ADB** (Android Debug Bridge) installed and in your PATH
2. Android device with USB debugging enabled or an emulator
3. Node.js 16 or higher

> **Note**: Emulator support is currently in testing phase. Physical devices are recommended for production use.

## 🎯 Quick Start

Some Examples can be checked in the [Examples](./examples) folder.

### Basic App Automation

``` javascript
import { Droideer } from 'droideer';

// Connect to device
const device = await Droideer.connect();
const page = await device.launch('com.android.settings');

// Interact with UI
await page.click({ text: 'Network & internet' });
await page.waitForSelector({ text: 'Wi-Fi' });
await page.screenshot('wifi-settings.png');

await device.disconnect();
```

### Data Scraping Example

``` javascript
import { Droideer } from 'droideer';

const device = await Droideer.connect();
const page = await device.launch('com.example.marketplace');

// Navigate to search
await page.click({ resourceId: 'search_button' });
await page.type({ resourceId: 'search_input' }, 'smartphones');
await page.pressKey(66); // Enter

// Scrape product listings with infinite scroll
const products = [];
let scrollCount = 0;
const maxScrolls = 20;

while (scrollCount < maxScrolls) {
    // Extract current page products
    const productElements = await page.$$({ resourceId: 'product_item' });

    for (const element of productElements) {
        const title = await element.getText();
        const price = await page.getText({ resourceId: 'product_price' });

        products.push({ title, price });
    }

    // Scroll for more products
    await page.scroll('down');
    await page.waitForTimeout(2000);
    scrollCount++;

    // Check if we've reached the end
    const noMoreItems = await page.$({ text: 'No more items' });
    if (noMoreItems) break;
}

console.log(`Scraped ${products.length} products`);
```

### Network Monitoring

``` javascript
import { Droideer } from 'droideer';

const device = await Droideer.connect();

// Monitor network activity during app usage
const networkResults = await device.networkMonitor.monitorAction(async () => {
    const page = await device.launch('com.booking');

    await page.click({ text: 'Search' });
    await page.type({ resourceId: 'destination' }, 'Paris');
    await page.click({ text: 'Search hotels' });

    // Wait for API calls to complete
    await page.waitForTimeout(5000);
}, {
    targetDomains: ['booking.com', 'api.booking'],  // Only monitor Booking APIs
    captureResponses: true
});

console.log(`Captured ${networkResults.summary.totalRequests} network requests`);
console.log('API Endpoints:', networkResults.data.apiEndpoints);
```

## 📚 API Reference

### Device

The `AndroidDevice` class represents a connected Android device.

``` javascript
// Connect to a device
const device = await Droideer.connect();

// Launch an app
const page = await device.launch('com.android.settings');

// Take a screenshot
await device.screenshot('device.png');

// Press hardware buttons
await device.back();
await device.home();

// Disconnect when done
await device.disconnect();
```

### Page

The `Page` class represents the current UI view of an Android app.

``` javascript
// Find elements
const element = await page.$({ text: 'Settings' });
const elements = await page.$$({ className: 'android.widget.Button' });

// Convenience methods
const button = await page.findByResourceId('submit_button');
const textElement = await page.findByText('Welcome');

// Interact with UI
await page.click({ text: 'Next' });
await page.type({ resourceId: 'username_field' }, 'john_doe');
await page.scroll('down', 500);

// Wait for elements or conditions
await page.waitForSelector({ text: 'Welcome' });
await page.waitForNavigation();
```

### Element

The `AndroidElement` class represents a UI element on the screen.

``` javascript
// Get element properties
const text = element.text;
const resourceId = element.resourceId;
const isEnabled = element.isEnabled;

// Interact with element
await element.click();
await element.type('Hello world');
await element.longPress();
await element.swipeLeft();
```

### Selectors

Droideer supports multiple selector strategies for finding elements:

``` javascript
// By text
await page.$({ text: 'Login' });

// By partial text
await page.$({ contains: 'Log' });

// By resource ID
await page.$({ resourceId: 'com.example.app:id/username' });

// By class name
await page.$({ className: 'android.widget.EditText' });

// By content description
await page.$({ contentDesc: 'Profile picture' });

// Combined selectors
await page.$({
  className: 'android.widget.Button',
  text: 'Login',
  clickable: true
});

// XPath-like selectors
await page.$x('//android.widget.Button[@text="Submit"]');
```

### Network Monitoring

``` javascript
// Start monitoring
await device.networkMonitor.startMonitoring({
    targetDomains: ['api.example.com'],
    captureResponses: true
});

// Perform actions...

// Stop and get results
const results = await device.networkMonitor.stopMonitoring();
```

## 🎭 Use Cases

### 1\. End\-to\-End Testing

``` javascript
import { test, expect } from '@playwright/test';
import { Droideer } from 'droideer';

test('user can complete purchase flow', async () => {
    const device = await Droideer.connect();
    const page = await device.launch('com.example.shop');

    // Test complete user journey
    await page.click({ text: 'Shop Now' });
    await page.type({ resourceId: 'search' }, 'running shoes');
    await page.click({ text: 'Search' });

    const firstProduct = await page.$({ resourceId: 'product_item' });
    await firstProduct.click();

    await page.click({ text: 'Add to Cart' });
    await page.click({ resourceId: 'cart_button' });
    await page.click({ text: 'Checkout' });

    const confirmationText = await page.waitForSelector({ text: 'Order confirmed' });
    expect(confirmationText).toBeTruthy();
});
```

### 2\. Data Scraping

``` javascript
// Scrape real estate listings
const device = await Droideer.connect();
const page = await device.launch('com.idealista.android');

const listings = [];
let hasMorePages = true;

while (hasMorePages) {
    const propertyElements = await page.$$({ resourceId: 'property_card' });

    for (const property of propertyElements) {
        const title = await property.getText();
        const price = await page.getText({ resourceId: 'property_price' });
        const location = await page.getText({ resourceId: 'property_location' });

        listings.push({ title, price, location });
    }

    // Try to go to next page
    const nextButton = await page.$({ text: 'Next' });
    if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(3000);
    } else {
        hasMorePages = false;
    }
}

console.log(`Scraped ${listings.length} property listings`);
```

### 3\. API Reverse Engineering ( Work in Progress )

``` javascript
// Monitor network traffic to understand app APIs
const device = await Droideer.connect();

const apiAnalysis = await device.networkMonitor.monitorAction(async () => {
    const page = await device.launch('com.airbnb.android');

    await page.type({ resourceId: 'search_location' }, 'New York');
    await page.click({ text: 'Search' });
    await page.waitForTimeout(5000);

    // Scroll to trigger pagination APIs
    for (let i = 0; i < 5; i++) {
        await page.scroll('down');
        await page.waitForTimeout(2000);
    }
}, {
    targetDomains: ['airbnb.com'],
    targetKeywords: ['api', 'search', 'listings'],
    captureResponses: true
});

console.log('Discovered API endpoints:', apiAnalysis.data.apiEndpoints);
console.log('JSON responses:', apiAnalysis.data.jsonResponses.length);
```

## 🧪 Testing

Droideer is perfect for end-to-end testing of Android applications.

``` javascript
import { Droideer } from 'droideer';
import { test, expect } from 'your-test-framework';

test('should login successfully', async () => {
  const device = await Droideer.connect();
  const page = await device.launch('com.example.app');

  await page.type({ resourceId: 'username' }, 'testuser');
  await page.type({ resourceId: 'password' }, 'password123');
  await page.click({ text: 'Login' });

  const welcomeElement = await page.waitForSelector({ text: 'Welcome' });
  expect(welcomeElement).not.toBeNull();

  await device.disconnect();
});
```

## 🚧 Development Status

This project is currently under active development. Here's what's working and what's planned:

### ✅ Working Features

* Core element finding and interaction
* Basic gestures and navigation
* Screenshot capabilities
* App management
* Network monitoring (basic)
* Real device support

## 📖 Documentation

* [API Documentation](./API.md) \- Detailed API reference
* Work in Progress...

### Development Setup

``` bash
git clone https://github.com/your-username/droideer.git
cd droideer
npm install
npm run build
npm test
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

* Inspired by [Puppeteer](https://github.com/puppeteer/puppeteer) for the web
* Built on top of Android Debug Bridge (ADB)

- - -

Built with ❤️ for Android automation, testing, and data extraction

**Star ⭐ this repo if you find it useful!**
