
import { Droideer } from 'droideer';

async function test() {
    try {
        console.log('✅ Droideer imported successfully');
        console.log('Version:', Droideer.version || 'Available');
        console.log('Connect method:', typeof Droideer.connect);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

test();

