import { Droideer } from '../src/index.js';
import { writeFileSync } from 'fs';

// Advanced network monitoring with multiple capture methods
async function advancedNetworkCapture() {
    console.log('🔬 Advanced Network Capture Example');
    
    const device = await Droideer.connect();
    
    // Enable additional logging for network libraries
    await setupNetworkLogging(device);
    
    const page = await device.launch('com.idealista.android');
    
    // Start comprehensive monitoring
    const networkResults = await device.networkMonitor.monitorAction(async () => {
        console.log('🏠 Performing Idealista search with enhanced monitoring...');
        
        await page.waitForTimeout(3000);
        
        // Perform search
        const categoryDropDown = await page.findByResourceId('com.idealista.android:id/propertyTypeSpinner');
        if (categoryDropDown) {
            await categoryDropDown.click();
            await page.waitForTimeout(2000); // More time for network calls
            
            const newConstruction = await page.findByResourceId('com.idealista.android:id/spinner_main_newDevelopment');
            if (newConstruction) {
                await newConstruction.click();
                await page.waitForTimeout(2000);
                
                const searchBtn = await page.findByResourceId('com.idealista.android:id/btSearch');
                if (searchBtn) {
                    console.log('🔍 Clicking search - monitoring API calls...');
                    await searchBtn.click();
                    await page.waitForTimeout(5000); // Wait for API responses
                    
                    // Scroll to trigger pagination/lazy loading
                    for (let i = 0; i < 3; i++) {
                        console.log(`📜 Scroll ${i + 1} - monitoring for lazy load APIs...`);
                        await page.scroll('up', 1000);
                        await page.waitForTimeout(3000); // Wait for API calls
                    }
                }
            }
        }
    }, {
        // Enhanced filtering for actual network traffic
        targetKeywords: [
            'okhttp', 'volley', 'retrofit',
            'http://', 'https://',
            'request url', 'response body',
            'content-type', 'application/json',
            '/api/', 'api.', 'graphql'
        ],
        ignoreDomains: [
            'crashlytics.com',
            'google-analytics.com',
            'facebook.com',
            'doubleclick.net'
        ],
        captureResponses: true,
        captureHeaders: true,
        minResponseSize: 50,
        logInterval: 1000 // Capture more frequently
    });
    
    // Additional network analysis
    const enhancedResults = await enhanceNetworkResults(device, networkResults);
    
    writeFileSync('idealista-advanced-network.json', JSON.stringify(enhancedResults, null, 2));
    displayAdvancedNetworkResults(enhancedResults);
    
    await device.disconnect();
}

async function setupNetworkLogging(device) {
    try {
        console.log('⚙️ Setting up enhanced network logging...');
        
        // Enable more verbose logging for network libraries
        const logCommands = [
            // Enable OkHttp logging if available
            'setprop log.tag.OkHttp DEBUG',
            'setprop log.tag.okhttp.OkHttpClient DEBUG',
            'setprop log.tag.okio.Buffer DEBUG',
            
            // Enable Volley logging
            'setprop log.tag.Volley DEBUG',
            'setprop log.tag.NetworkImageView DEBUG',
            
            // Enable general network logging
            'setprop log.tag.NetworkSecurityConfig DEBUG',
            'setprop log.tag.HttpURLConnection DEBUG',
            
            // Enable app-specific logging (if supported)
            'setprop log.tag.idealistanetwork DEBUG',
            'setprop log.tag.retrofit DEBUG'
        ];
        
        for (const command of logCommands) {
            try {
                await device.adb.shell(command);
            } catch (error) {
                // Continue if command fails
            }
        }
        
        console.log('✅ Network logging setup completed');
        
    } catch (error) {
        console.warn('⚠️ Could not set up enhanced logging:', error.message);
    }
}

async function enhanceNetworkResults(device, networkResults) {
    console.log('🔬 Enhancing network results with additional analysis...');
    
    // Get additional network information
    const networkStats = await captureDetailedNetworkStats(device);
    const processInfo = await captureProcessNetworkInfo(device);
    
    // Analyze captured data
    const analysis = analyzeNetworkTraffic(networkResults);
    
    return {
        ...networkResults,
        enhancedAnalysis: analysis,
        systemNetworkStats: networkStats,
        processNetworkInfo: processInfo,
        recommendations: generateRecommendations(analysis)
    };
}

async function captureDetailedNetworkStats(device) {
    const stats = {};
    
    try {
        // Network interface statistics
        stats.netdev = await device.adb.shell('cat /proc/net/dev');
        
        // Active network connections
        stats.netstat = await device.adb.shell('netstat -an 2>/dev/null || cat /proc/net/tcp');
        
        // DNS resolution info
        stats.resolv = await device.adb.shell('cat /system/etc/resolv.conf 2>/dev/null || getprop net.dns1');
        
        // Network configuration
        stats.ifconfig = await device.adb.shell('ip addr show 2>/dev/null || ifconfig');
        
    } catch (error) {
        console.warn('Could not capture all network stats:', error.message);
    }
    
    return stats;
}

async function captureProcessNetworkInfo(device) {
    const processInfo = {};
    
    try {
        // Get current app process info
        const currentApp = await device.getCurrentApp();
        if (currentApp && currentApp.package) {
            // Process network usage
            processInfo.appPackage = currentApp.package;
            
            // Get process ID
            const psOutput = await device.adb.shell(`ps | grep ${currentApp.package}`);
            const pidMatch = psOutput.match(/\s+(\d+)\s+/);
            
            if (pidMatch) {
                processInfo.pid = pidMatch[1];
                
                // Network file descriptors for this process
                try {
                    processInfo.networkFds = await device.adb.shell(`ls -la /proc/${processInfo.pid}/fd | grep socket`);
                } catch (error) {
                    // Not available on all devices
                }
            }
        }
        
    } catch (error) {
        console.warn('Could not capture process network info:', error.message);
    }
    
    return processInfo;
}

function analyzeNetworkTraffic(networkResults) {
    const analysis = {
        httpLibraries: new Set(),
        apiPatterns: new Set(),
        responseTypes: {},
        requestMethods: new Set(),
        domains: new Set(),
        suspectedEndpoints: [],
        dataStructures: []
    };
    
    // Analyze HTTP requests
    networkResults.data.httpRequests.forEach(request => {
        const line = request.logLine.toLowerCase();
        
        // Detect HTTP libraries
        if (line.includes('okhttp')) analysis.httpLibraries.add('OkHttp');
        if (line.includes('volley')) analysis.httpLibraries.add('Volley');
        if (line.includes('retrofit')) analysis.httpLibraries.add('Retrofit');
        if (line.includes('httpurlconnection')) analysis.httpLibraries.add('HttpURLConnection');
        
        // Extract HTTP methods
        const methodMatch = line.match(/\b(get|post|put|delete|patch|head|options)\b/i);
        if (methodMatch) {
            analysis.requestMethods.add(methodMatch[1].toUpperCase());
        }
        
        // Extract API patterns
        const apiMatches = line.match(/\/api\/[a-zA-Z0-9\/._-]+/g);
        if (apiMatches) {
            apiMatches.forEach(api => analysis.apiPatterns.add(api));
        }
    });
    
    // Analyze responses
    networkResults.data.responses.forEach(response => {
        // Detect response content types
        const data = response.data.toLowerCase();
        
        if (data.includes('application/json') || data.includes('"data"')) {
            analysis.responseTypes.json = (analysis.responseTypes.json || 0) + 1;
        }
        if (data.includes('text/html')) {
            analysis.responseTypes.html = (analysis.responseTypes.html || 0) + 1;
        }
        if (data.includes('image/')) {
            analysis.responseTypes.image = (analysis.responseTypes.image || 0) + 1;
        }
        
        // Look for property/real estate specific data structures
        if (data.includes('properties') || data.includes('listings')) {
            analysis.dataStructures.push({
                type: 'property_listing',
                sample: response.data.substring(0, 200),
                timestamp: response.timestamp
            });
        }
    });
    
    // Convert Sets to Arrays
    analysis.httpLibraries = Array.from(analysis.httpLibraries);
    analysis.apiPatterns = Array.from(analysis.apiPatterns);
    analysis.requestMethods = Array.from(analysis.requestMethods);
    analysis.domains = Array.from(analysis.domains);
    
    return analysis;
}

function generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.httpLibraries.length === 0) {
        recommendations.push({
            type: 'warning',
            message: 'No HTTP libraries detected in logs. Consider enabling more verbose logging or using a different monitoring approach.'
        });
    }
    
    if (analysis.apiPatterns.length === 0) {
        recommendations.push({
            type: 'warning',
            message: 'No API patterns detected. The app might be using encrypted traffic or non-standard endpoints.'
        });
    }
    
    if (analysis.responseTypes.json && analysis.responseTypes.json > 0) {
        recommendations.push({
            type: 'success',
            message: `Found ${analysis.responseTypes.json} JSON responses. These likely contain API data you can analyze.`
        });
    }
    
    if (analysis.dataStructures.length > 0) {
        recommendations.push({
            type: 'success',
            message: `Detected ${analysis.dataStructures.length} property/listing data structures. Check the dataStructures array for samples.`
        });
    }
    
    if (analysis.httpLibraries.includes('OkHttp')) {
        recommendations.push({
            type: 'info',
            message: 'App uses OkHttp. Consider using OkHttp interceptors or Frida hooks for more detailed traffic analysis.'
        });
    }
    
    return recommendations;
}

function displayAdvancedNetworkResults(results) {
    console.log('\n🔬 ADVANCED NETWORK ANALYSIS RESULTS:');
    console.log('=' * 60);
    
    // Basic stats
    console.log(`📊 Total Network Events: ${results.summary.totalRequests}`);
    console.log(`🌐 API Endpoints: ${results.summary.uniqueEndpoints}`);
    console.log(`🏠 Domains: ${results.summary.uniqueDomains}`);
    console.log(`📋 JSON Responses: ${results.data.jsonResponses.length}`);
    
    // Enhanced analysis
    const analysis = results.enhancedAnalysis;
    
    if (analysis.httpLibraries.length > 0) {
        console.log(`\n📚 HTTP Libraries Detected: ${analysis.httpLibraries.join(', ')}`);
    }
    
    if (analysis.requestMethods.length > 0) {
        console.log(`🔧 HTTP Methods Used: ${analysis.requestMethods.join(', ')}`);
    }
    
    if (analysis.apiPatterns.length > 0) {
        console.log('\n🎯 API Patterns Found:');
        analysis.apiPatterns.slice(0, 10).forEach((pattern, i) => {
            console.log(`  ${i + 1}. ${pattern}`);
        });
    }
    
    if (Object.keys(analysis.responseTypes).length > 0) {
        console.log('\n📄 Response Types:');
        Object.entries(analysis.responseTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count} responses`);
        });
    }
    
    if (analysis.dataStructures.length > 0) {
        console.log(`\n🏠 Property Data Structures Found: ${analysis.dataStructures.length}`);
        console.log('  (Check JSON file for detailed samples)');
    }
    
    // Recommendations
    if (results.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        results.recommendations.forEach((rec, i) => {
            const icon = rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`  ${icon} ${rec.message}`);
        });
    }
    
    console.log('\n💾 Detailed results saved to idealista-advanced-network.json');
}

// Alternative approach using packet capture (requires root)
async function attemptPacketCapture(device) {
    console.log('📡 Attempting packet capture (requires root)...');
    
    try {
        // Check if device is rooted
        const rootCheck = await device.adb.shell('su -c "id" 2>/dev/null');
        
        if (rootCheck.includes('uid=0')) {
            console.log('📱 Device is rooted - attempting tcpdump...');
            
            // Try to capture packets
            const tcpdumpResult = await device.adb.shell('su -c "tcpdump -i any -s 0 -w /sdcard/capture.pcap host api.idealista.com" &');
            
            return { success: true, message: 'Packet capture started' };
        } else {
            return { success: false, message: 'Device not rooted - packet capture not available' };
        }
        
    } catch (error) {
        return { success: false, message: `Packet capture failed: ${error.message}` };
    }
}

// Main execution
(async () => {
    try {
        await advancedNetworkCapture();
    } catch (error) {
        console.error('❌ Advanced network capture failed:', error.message);
    }
})();