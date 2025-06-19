import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ADB {
    constructor(deviceId = null) {
        this.deviceId = deviceId;
        this.prefix = deviceId ? `adb -s ${deviceId}` : 'adb';
        this._capabilities = null;
    }

    async execute(command, options = {}) {
        const timeout = options.timeout || 30000;
        const fullCommand = `${this.prefix} ${command}`;
        
        try {
            const { stdout, stderr } = await execAsync(fullCommand, { timeout });
            
            // Some ADB commands return info via stderr that's not actually an error
            if (stderr && !this._isWarning(stderr)) {
                throw new Error(stderr);
            }
            
            return stdout.trim();
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                throw new Error(`ADB command timed out after ${timeout}ms: ${command}`);
            }
            throw new Error(`ADB command failed: ${error.message}`);
        }
    }

    _isWarning(stderr) {
        const warnings = [
            'Warning:',
            'adb: failed to install',
            '* daemon not running',
            '* daemon started successfully'
        ];
        return warnings.some(warning => stderr.includes(warning));
    }

    async shell(command, options = {}) {
        // Escape command properly for shell
        const escapedCommand = command.replace(/"/g, '\\"');
        return this.execute(`shell "${escapedCommand}"`, options);
    }

    // Device management
    async getDevices() {
        const output = await this.execute('devices -l');
        const lines = output.split('\n').slice(1); // Skip header
        return lines
            .filter(line => line.trim() && !line.includes('daemon'))
            .map(line => {
                const parts = line.split(/\s+/);
                return {
                    id: parts[0],
                    state: parts[1],
                    info: parts.slice(2).join(' ')
                };
            });
    }

    async getDeviceInfo() {
        if (!this._capabilities) {
            const brand = await this.shell('getprop ro.product.brand').catch(() => 'Unknown');
            const model = await this.shell('getprop ro.product.model').catch(() => 'Unknown');
            const version = await this.shell('getprop ro.build.version.release').catch(() => 'Unknown');
            const sdk = await this.shell('getprop ro.build.version.sdk').catch(() => 'Unknown');
            
            this._capabilities = { brand, model, version, sdk };
        }
        return this._capabilities;
    }

    async isConnected() {
        try {
            const state = await this.execute('get-state');
            return state === 'device';
        } catch (error) {
            return false;
        }
    }

    // App management
    async isPackageInstalled(packageName) {
        try {
            const result = await this.shell(`pm list packages ${packageName}`);
            return result.includes(`package:${packageName}`);
        } catch (error) {
            return false;
        }
    }

    async getPackageInfo(packageName) {
        try {
            const info = await this.shell(`dumpsys package ${packageName} | head -50`);
            const lines = info.split('\n');
            
            const packageInfo = {
                package: packageName,
                versionName: null,
                versionCode: null,
                enabled: true,
                installed: true
            };
            
            for (const line of lines) {
                if (line.includes('versionName=')) {
                    packageInfo.versionName = line.split('versionName=')[1]?.split(' ')[0];
                }
                if (line.includes('versionCode=')) {
                    packageInfo.versionCode = line.split('versionCode=')[1]?.split(' ')[0];
                }
            }
            
            return packageInfo;
        } catch (error) {
            return null;
        }
    }

    async getLauncherActivity(packageName) {
        try {
            // Multiple methods to find launcher activity
            const methods = [
                // Method 1: Use cmd package resolve-activity
                async () => {
                    const result = await this.shell(`cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER ${packageName}`);
                    const match = result.match(/([a-zA-Z0-9_.]+\/[a-zA-Z0-9_.]+)/);
                    return match ? match[1] : null;
                },
                
                // Method 2: Parse dumpsys package
                async () => {
                    const dump = await this.shell(`dumpsys package ${packageName} | grep -A 5 "android.intent.action.MAIN"`);
                    const lines = dump.split('\n');
                    for (const line of lines) {
                        if (line.includes('android.intent.category.LAUNCHER')) {
                            const prevLine = lines[lines.indexOf(line) - 1];
                            const match = prevLine?.match(/([a-zA-Z0-9_.]+)\/([a-zA-Z0-9_.]+)/);
                            if (match) return `${match[1]}/${match[2]}`;
                        }
                    }
                    return null;
                },
                
                // Method 3: Use pm dump with specific parsing
                async () => {
                    const dump = await this.shell(`pm dump ${packageName} | grep -B 2 -A 2 "android.intent.category.LAUNCHER"`);
                    const match = dump.match(/Activity #\d+:\s*([a-zA-Z0-9_.]+\/[a-zA-Z0-9_.]+)/);
                    return match ? match[1] : null;
                }
            ];
            
            for (const method of methods) {
                try {
                    const result = await method();
                    if (result) return result;
                } catch (error) {
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('Error getting launcher activity:', error.message);
            return null;
        }
    }

    async startApp(packageName) {
        console.log(`🚀 Starting app: ${packageName}`);
        
        // Verify package is installed
        const isInstalled = await this.isPackageInstalled(packageName);
        if (!isInstalled) {
            throw new Error(`Package ${packageName} is not installed`);
        }
        
        // Try multiple launch methods in order of reliability
        const launchMethods = [
            {
                name: 'Direct Activity Launch',
                action: async () => {
                    const activity = await this.getLauncherActivity(packageName);
                    if (!activity) throw new Error('No launcher activity found');
                    
                    const result = await this.shell(`am start -n ${activity}`);
                    if (result.includes('Error') || result.includes('Exception')) {
                        throw new Error(result);
                    }
                    return result;
                }
            },
            {
                name: 'Monkey Launch',
                action: async () => {
                    const result = await this.shell(`monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
                    if (result.includes('Error') || result.includes('No activities found') || result.includes('killed')) {
                        throw new Error(result);
                    }
                    return result;
                }
            },
            {
                name: 'Intent Launch',
                action: async () => {
                    const result = await this.shell(`am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER ${packageName}`);
                    if (result.includes('Error') || result.includes('No Activity found')) {
                        throw new Error(result);
                    }
                    return result;
                }
            },
            {
                name: 'Force Launch',
                action: async () => {
                    return await this.shell(`am start --user 0 -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -f 0x10200000 ${packageName}`);
                }
            }
        ];
        
        for (const method of launchMethods) {
            try {
                console.log(`📱 Trying ${method.name}...`);
                const result = await method.action();
                
                // Wait for app to actually start
                await this._waitForAppStart(packageName, 5000);
                
                console.log(`✅ App started successfully using ${method.name}`);
                return result;
            } catch (error) {
                console.log(`❌ ${method.name} failed: ${error.message}`);
                continue;
            }
        }
        
        // All methods failed, provide diagnostic info
        await this._provideDiagnostics(packageName);
        throw new Error(`Unable to start app ${packageName}. All launch methods failed.`);
    }

    async _waitForAppStart(packageName, timeout = 10000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const currentActivity = await this.getCurrentActivity();
                if (currentActivity?.package === packageName) {
                    return true;
                }
            } catch (error) {
                // Continue waiting
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error(`App ${packageName} did not start within ${timeout}ms`);
    }

    async _provideDiagnostics(packageName) {
        console.log('🔍 Diagnostic Information:');
        try {
            const packageInfo = await this.getPackageInfo(packageName);
            console.log('📦 Package Info:', packageInfo);
            
            const launcherActivity = await this.getLauncherActivity(packageName);
            console.log('🎯 Launcher Activity:', launcherActivity || 'Not found');
            
            const isEnabled = await this.shell(`pm list packages -e ${packageName}`);
            console.log('⚡ Package Enabled:', isEnabled.includes(packageName));
            
        } catch (error) {
            console.log('❌ Could not gather diagnostics:', error.message);
        }
    }

    async stopApp(packageName) {
        return this.shell(`am force-stop ${packageName}`);
    }

    async clearApp(packageName) {
        return this.shell(`pm clear ${packageName}`);
    }

    async getCurrentActivity() {
        try {
            // Try multiple methods to get current activity
            const methods = [
                async () => {
                    const output = await this.shell('dumpsys window | grep mCurrentFocus');
                    const match = output.match(/mCurrentFocus=Window{[^}]* ([^/]+)\/([^}]+)}/);
                    return match ? { package: match[1], activity: match[2] } : null;
                },
                async () => {
                    const output = await this.shell('dumpsys activity activities | grep "mResumedActivity"');
                    const match = output.match(/([a-zA-Z0-9_.]+)\/([a-zA-Z0-9_.]+)/);
                    return match ? { package: match[1], activity: match[2] } : null;
                }
            ];
            
            for (const method of methods) {
                try {
                    const result = await method();
                    if (result) return result;
                } catch (error) {
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    // Input methods
    async tap(x, y) {
        return this.shell(`input tap ${x} ${y}`);
    }

    async swipe(x1, y1, x2, y2, duration = 300) {
        return this.shell(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
    }

    async type(text) {
        // Handle special characters and spaces
        const escapedText = text
            .replace(/'/g, "\\'")
            .replace(/ /g, '%s')
            .replace(/&/g, '\\&')
            .replace(/\$/g, '\\$');
        return this.shell(`input text '${escapedText}'`);
    }

    async keyEvent(keyCode) {
        return this.shell(`input keyevent ${keyCode}`);
    }

    // Screen methods
    async screenshot(path) {
        return this.execute(`exec-out screencap -p > "${path}"`);
    }

    async getScreenSize() {
        const output = await this.shell('wm size');
        const match = output.match(/(\d+)x(\d+)/);
        if (match) {
            return {
                width: parseInt(match[1]),
                height: parseInt(match[2])
            };
        }
        throw new Error('Could not determine screen size');
    }

    async getUIHierarchy() {
        try {
            console.log('🔍 Fetching UI hierarchy...');
            
            // Try multiple approaches for UI dump, similar to your working implementation
            const methods = [
                // Method 1: Standard uiautomator dump
                {
                    name: 'Standard UI Dump',
                    action: async () => {
                        await this.shell('uiautomator dump /sdcard/ui.xml');
                        return await this.shell('cat /sdcard/ui.xml');
                    }
                },
                // Method 2: Compressed dump
                {
                    name: 'Compressed UI Dump',
                    action: async () => {
                        await this.shell('uiautomator dump --compressed /sdcard/ui.xml');
                        return await this.shell('cat /sdcard/ui.xml');
                    }
                },
                // Method 3: Direct to stdout
                {
                    name: 'Direct stdout dump',
                    action: async () => {
                        return await this.shell('uiautomator dump /dev/tty');
                    }
                },
                // Method 4: Alternative location
                {
                    name: 'Alternative location dump',
                    action: async () => {
                        await this.shell('uiautomator dump /data/local/tmp/ui.xml');
                        return await this.shell('cat /data/local/tmp/ui.xml');
                    }
                }
            ];

            for (const method of methods) {
                try {
                    console.log(`📱 Trying ${method.name}...`);
                    const xmlContent = await method.action();
                    
                    if (xmlContent && xmlContent.includes('<hierarchy')) {
                        console.log(`✅ UI hierarchy obtained using ${method.name}`);
                        console.log(`📊 XML length: ${xmlContent.length} characters`);
                        
                        // Log first few attributes to verify we're getting resource IDs
                        const resourceIdMatch = xmlContent.match(/resource-id="[^"]+"/);
                        const textMatch = xmlContent.match(/text="[^"]+"/);
                        if (resourceIdMatch) {
                            console.log(`🎯 Found resource IDs: ${resourceIdMatch[0]}`);
                        }
                        if (textMatch) {
                            console.log(`📝 Found text: ${textMatch[0]}`);
                        }
                        
                        return xmlContent;
                    }
                } catch (error) {
                    console.warn(`❌ ${method.name} failed: ${error.message}`);
                    continue;
                }
            }

            throw new Error('All UI dump methods failed');
            
        } catch (error) {
            console.error('❌ UI hierarchy retrieval failed:', error.message);
            
            // Return a minimal XML structure instead of throwing
            return `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
    <node index="0" text="UI Dump Failed - Please refresh" resource-id="" class="android.widget.FrameLayout" 
          bounds="[0,0][1080,1920]" content-desc="UI dump failed" clickable="false" enabled="true" 
          focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" 
          selected="false" visible-to-user="true" package="system"/>
</hierarchy>`;
        }
    }

    // Utility methods
    async back() {
        return this.keyEvent(4); // KEYCODE_BACK
    }

    async home() {
        return this.keyEvent(3); // KEYCODE_HOME
    }

    async menu() {
        return this.keyEvent(82); // KEYCODE_MENU
    }

    async recentApps() {
        return this.keyEvent(187); // KEYCODE_APP_SWITCH
    }
}