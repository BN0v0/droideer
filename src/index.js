import { AndroidDevice } from './Device.js';
import { ADB } from './utils/adb.js';
import { Page } from './Page.js';
import { AndroidElement } from './Element.js';
import { Gestures } from './Gestures.js';
import { Selector } from './Selector.js';

/**
 * Droideer - Android Automation Library
 * A Puppeteer-like automation library for Android devices
 */
export class Droideer {
    // Add this line to your class
    static VERSION = '0.1.0';
    /**
     * Connect to an Android device
     * @param {string|null} deviceId - Specific device ID or null for default
     * @returns {Promise<AndroidDevice>} Connected device instance
     */
    static async connect(deviceId = null) {
        return AndroidDevice.connect(deviceId);
    }

    /**
     * Launch an app and return a device instance
     * @param {Object} options - Launch options
     * @param {string} options.app - Package name of the app to launch
     * @param {string} options.deviceId - Device ID (optional)
     * @param {number} options.timeout - Launch timeout in ms (optional)
     * @returns {Promise<AndroidDevice>} Device instance with app launched
     */
    static async launch(options = {}) {
        const device = await AndroidDevice.connect(options.deviceId);

        if (options.app) {
            await device.launch(options.app);
        }

        return device;
    }

    /**
     * Get a new page instance for an already connected device
     * @param {string|null} deviceId - Device ID or null for default
     * @returns {Promise<Page>} Page instance
     */
    static async newPage(deviceId = null) {
        const device = await AndroidDevice.connect(deviceId);
        return device.page;
    }

    /**
     * List all connected Android devices
     * @returns {Promise<Array>} Array of device information
     */
    static async devices() {
        const adb = new ADB();
        return adb.getDevices();
    }

    /**
     * Check if ADB is available and working
     * @returns {Promise<boolean>} True if ADB is available
     */
    static async checkADB() {
        try {
            const adb = new ADB();
            await adb.execute('version');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get version information
     * @returns {Object} Version information
     */
    static version() {
        return {
            droideer: '0.1.0',
            description: 'Android automation library with Puppeteer-like API'
        };
    }

    // ✅ Add this: Simple version property for easy access
    static get versionString() {
        return '1.0.0';
    }

    // ✅ Or even simpler: static property
    static VERSION = '1.0.0';
}

// Key codes constants for easy reference
export const KeyCodes = {
    UNKNOWN: 0,
    SOFT_LEFT: 1,
    SOFT_RIGHT: 2,
    HOME: 3,
    BACK: 4,
    CALL: 5,
    ENDCALL: 6,
    CLEAR: 28,
    A: 29,
    B: 30,
    C: 31,
    D: 32,
    E: 33,
    F: 34,
    G: 35,
    H: 36,
    I: 37,
    J: 38,
    K: 39,
    L: 40,
    M: 41,
    N: 42,
    O: 43,
    P: 44,
    Q: 45,
    R: 46,
    S: 47,
    T: 48,
    U: 49,
    V: 50,
    W: 51,
    X: 52,
    Y: 53,
    Z: 54,
    COMMA: 55,
    PERIOD: 56,
    ALT_LEFT: 57,
    ALT_RIGHT: 58,
    SHIFT_LEFT: 59,
    SHIFT_RIGHT: 60,
    TAB: 61,
    SPACE: 62,
    SYM: 63,
    EXPLORER: 64,
    ENVELOPE: 65,
    ENTER: 66,
    DEL: 67,
    GRAVE: 68,
    MINUS: 69,
    EQUALS: 70,
    LEFT_BRACKET: 71,
    RIGHT_BRACKET: 72,
    BACKSLASH: 73,
    SEMICOLON: 74,
    APOSTROPHE: 75,
    SLASH: 76,
    AT: 77,
    NUM: 78,
    HEADSETHOOK: 79,
    FOCUS: 80,
    PLUS: 81,
    MENU: 82,
    NOTIFICATION: 83,
    SEARCH: 84,
    MEDIA_PLAY_PAUSE: 85,
    MEDIA_STOP: 86,
    MEDIA_NEXT: 87,
    MEDIA_PREVIOUS: 88,
    MEDIA_REWIND: 89,
    MEDIA_FAST_FORWARD: 90,
    MUTE: 91,
    PAGE_UP: 92,
    PAGE_DOWN: 93,
    PICTSYMBOLS: 94,
    SWITCH_CHARSET: 95,
    BUTTON_A: 96,
    BUTTON_B: 97,
    BUTTON_C: 98,
    BUTTON_X: 99,
    BUTTON_Y: 100,
    BUTTON_Z: 101,
    BUTTON_L1: 102,
    BUTTON_R1: 103,
    BUTTON_L2: 104,
    BUTTON_R2: 105,
    BUTTON_THUMBL: 106,
    BUTTON_THUMBR: 107,
    BUTTON_START: 108,
    BUTTON_SELECT: 109,
    BUTTON_MODE: 110,
    ESCAPE: 111,
    FORWARD_DEL: 112,
    CTRL_LEFT: 113,
    CTRL_RIGHT: 114,
    CAPS_LOCK: 115,
    SCROLL_LOCK: 116,
    META_LEFT: 117,
    META_RIGHT: 118,
    FUNCTION: 119,
    SYSRQ: 120,
    BREAK: 121,
    MOVE_HOME: 122,
    MOVE_END: 123,
    INSERT: 124,
    FORWARD: 125,
    MEDIA_PLAY: 126,
    MEDIA_PAUSE: 127,
    MEDIA_CLOSE: 128,
    MEDIA_EJECT: 129,
    MEDIA_RECORD: 130,
    F1: 131,
    F2: 132,
    F3: 133,
    F4: 134,
    F5: 135,
    F6: 136,
    F7: 137,
    F8: 138,
    F9: 139,
    F10: 140,
    F11: 141,
    F12: 142,
    NUM_LOCK: 143,
    NUMPAD_0: 144,
    NUMPAD_1: 145,
    NUMPAD_2: 146,
    NUMPAD_3: 147,
    NUMPAD_4: 148,
    NUMPAD_5: 149,
    NUMPAD_6: 150,
    NUMPAD_7: 151,
    NUMPAD_8: 152,
    NUMPAD_9: 153,
    NUMPAD_DIVIDE: 154,
    NUMPAD_MULTIPLY: 155,
    NUMPAD_SUBTRACT: 156,
    NUMPAD_ADD: 157,
    NUMPAD_DOT: 158,
    NUMPAD_COMMA: 159,
    NUMPAD_ENTER: 160,
    NUMPAD_EQUALS: 161,
    NUMPAD_LEFT_PAREN: 162,
    NUMPAD_RIGHT_PAREN: 163,
    VOLUME_MUTE: 164,
    INFO: 165,
    CHANNEL_UP: 166,
    CHANNEL_DOWN: 167,
    ZOOM_IN: 168,
    ZOOM_OUT: 169,
    TV: 170,
    WINDOW: 171,
    GUIDE: 172,
    DVR: 173,
    BOOKMARK: 174,
    CAPTIONS: 175,
    SETTINGS: 176,
    TV_POWER: 177,
    TV_INPUT: 178,
    STB_POWER: 179,
    STB_INPUT: 180,
    AVR_POWER: 181,
    AVR_INPUT: 182,
    PROG_RED: 183,
    PROG_GREEN: 184,
    PROG_YELLOW: 185,
    PROG_BLUE: 186,
    APP_SWITCH: 187,
    BUTTON_1: 188,
    BUTTON_2: 189,
    BUTTON_3: 190,
    BUTTON_4: 191,
    BUTTON_5: 192,
    BUTTON_6: 193,
    BUTTON_7: 194,
    BUTTON_8: 195,
    BUTTON_9: 196,
    BUTTON_10: 197,
    BUTTON_11: 198,
    BUTTON_12: 199,
    BUTTON_13: 200,
    BUTTON_14: 201,
    BUTTON_15: 202,
    BUTTON_16: 203,
    LANGUAGE_SWITCH: 204,
    MANNER_MODE: 205,
    THREE_D_MODE: 206,
    CONTACTS: 207,
    CALENDAR: 208,
    MUSIC: 209,
    CALCULATOR: 210,
    ZENKAKU_HANKAKU: 211,
    EISU: 212,
    MUHENKAN: 213,
    HENKAN: 214,
    KATAKANA_HIRAGANA: 215,
    YEN: 216,
    RO: 217,
    KANA: 218,
    ASSIST: 219,
    BRIGHTNESS_DOWN: 220,
    BRIGHTNESS_UP: 221,
    MEDIA_AUDIO_TRACK: 222,
    SLEEP: 223,
    WAKEUP: 224,
    PAIRING: 225,
    MEDIA_TOP_MENU: 226,
    11: 227,
    12: 228,
    LAST_CHANNEL: 229,
    TV_DATA_SERVICE: 230,
    VOICE_ASSIST: 231,
    TV_RADIO_SERVICE: 232,
    TV_TELETEXT: 233,
    TV_NUMBER_ENTRY: 234,
    TV_TERRESTRIAL_ANALOG: 235,
    TV_TERRESTRIAL_DIGITAL: 236,
    TV_SATELLITE: 237,
    TV_SATELLITE_BS: 238,
    TV_SATELLITE_CS: 239,
    TV_SATELLITE_SERVICE: 240,
    TV_NETWORK: 241,
    TV_ANTENNA_CABLE: 242,
    TV_INPUT_HDMI_1: 243,
    TV_INPUT_HDMI_2: 244,
    TV_INPUT_HDMI_3: 245,
    TV_INPUT_HDMI_4: 246,
    TV_INPUT_COMPOSITE_1: 247,
    TV_INPUT_COMPOSITE_2: 248,
    TV_INPUT_COMPONENT_1: 249,
    TV_INPUT_COMPONENT_2: 250,
    TV_INPUT_VGA_1: 251,
    TV_AUDIO_DESCRIPTION: 252,
    TV_AUDIO_DESCRIPTION_MIX_UP: 253,
    TV_AUDIO_DESCRIPTION_MIX_DOWN: 254,
    TV_ZOOM_MODE: 255,
    TV_CONTENTS_MENU: 256,
    TV_MEDIA_CONTEXT_MENU: 257,
    TV_TIMER_PROGRAMMING: 258,
    HELP: 259,
    NAVIGATE_PREVIOUS: 260,
    NAVIGATE_NEXT: 261,
    NAVIGATE_IN: 262,
    NAVIGATE_OUT: 263,
    STEM_PRIMARY: 264,
    STEM_1: 265,
    STEM_2: 266,
    STEM_3: 267,
    DPAD_UP_LEFT: 268,
    DPAD_DOWN_LEFT: 269,
    DPAD_UP_RIGHT: 270,
    DPAD_DOWN_RIGHT: 271,
    MEDIA_SKIP_FORWARD: 272,
    MEDIA_SKIP_BACKWARD: 273,
    MEDIA_STEP_FORWARD: 274,
    MEDIA_STEP_BACKWARD: 275,
    SOFT_SLEEP: 276,
    CUT: 277,
    COPY: 278,
    PASTE: 279,
    SYSTEM_NAVIGATION_UP: 280,
    SYSTEM_NAVIGATION_DOWN: 281,
    SYSTEM_NAVIGATION_LEFT: 282,
    SYSTEM_NAVIGATION_RIGHT: 283,
    ALL_APPS: 284,
    REFRESH: 285,
    THUMBS_UP: 286,
    THUMBS_DOWN: 287,
    PROFILE_SWITCH: 288
};

// Export all classes for individual use
export {
    AndroidDevice,
    ADB,
    Page,
    AndroidElement,
    Gestures,
    Selector
};

// Default export
export default Droideer;