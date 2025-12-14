// API Configuration
// API Configuration
export const API_BASE_URL = 'https://dermaai-1d9i.onrender.com';
// export const API_BASE_URL = __DEV__
//     ? 'http://localhost:5000'
//     : 'https://dermaai-1d9i.onrender.com'; // Production URL

export const API_TIMEOUT = 30000; // 30 seconds for normal requests
export const ANALYSIS_TIMEOUT = 120000; // 120 seconds (2 min) for AI analysis

// App Configuration
export const APP_NAME = 'Corio Scan';
export const APP_VERSION = '1.0.0';

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = '777356876175-obvv7v2lpshqlp2llqt8pv9cmom7088n.apps.googleusercontent.com';
// iOS and Android client IDs (create in Google Cloud Console if needed)
export const GOOGLE_IOS_CLIENT_ID = ''; // Add iOS client ID if needed
export const GOOGLE_ANDROID_CLIENT_ID = ''; // Add Android client ID if needed

// Image Configuration
export const MAX_IMAGES = 3;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const IMAGE_QUALITY = 0.8;
export const IMAGE_MAX_DIMENSION = 2048;

// Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'corio_access_token',
    REFRESH_TOKEN: 'corio_refresh_token',
    USER_DATA: 'corio_user_data',
    THEME: 'corio_theme',
    TUTORIAL_SHOWN: 'corio_tutorial_shown',
    MEDICAL_CONSENT_ACCEPTED: 'corio_medical_consent_accepted',
} as const;


// Symptom Options (from web app)
export const SYMPTOM_OPTIONS = [
    { value: 'itching', label: 'Itching (Kaşıntı)' },
    { value: 'pain', label: 'Pain (Ağrı)' },
    { value: 'burning', label: 'Burning (Yanma)' },
    { value: 'bleeding', label: 'Bleeding (Kanama)' },
    { value: 'discharge', label: 'Discharge (Akıntı)' },
    { value: 'scaling', label: 'Scaling (Pullanma)' },
    { value: 'crusting', label: 'Crusting (Kabuklanma)' },
    { value: 'swelling', label: 'Swelling (Şişlik)' },
    { value: 'redness', label: 'Redness (Kızarıklık)' },
    { value: 'color-change', label: 'Color Change (Renk Değişimi)' },
    { value: 'size-change', label: 'Size Change (Boyut Değişimi)' },
    { value: 'texture-change', label: 'Texture Change (Doku Değişimi)' },
] as const;

// Lesion Locations
export const LESION_LOCATIONS = [
    { value: 'head', label: 'Baş (Head)' },
    { value: 'face', label: 'Yüz (Face)' },
    { value: 'neck', label: 'Boyun (Neck)' },
    { value: 'chest', label: 'Göğüs (Chest)' },
    { value: 'back', label: 'Sırt (Back)' },
    { value: 'abdomen', label: 'Karın (Abdomen)' },
    { value: 'upper-arm', label: 'Üst Kol (Upper Arm)' },
    { value: 'forearm', label: 'Alt Kol (Forearm)' },
    { value: 'hand', label: 'El (Hand)' },
    { value: 'upper-leg', label: 'Üst Bacak (Upper Leg)' },
    { value: 'lower-leg', label: 'Alt Bacak (Lower Leg)' },
    { value: 'foot', label: 'Ayak (Foot)' },
    { value: 'genital', label: 'Genital Bölge (Genital Area)' },
] as const;

// Symptom Duration Options
export const DURATION_OPTIONS = [
    { value: 'less-than-1-week', label: 'Less than 1 week (1 haftadan az)' },
    { value: '1-4-weeks', label: '1-4 weeks (1-4 hafta)' },
    { value: '1-6-months', label: '1-6 months (1-6 ay)' },
    { value: 'more-than-6-months', label: 'More than 6 months (6 aydan fazla)' },
] as const;

// Skin Types
export const SKIN_TYPES = [
    { value: 'type1', label: 'Type I (Very Fair)' },
    { value: 'type2', label: 'Type II (Fair)' },
    { value: 'type3', label: 'Type III (Medium)' },
    { value: 'type4', label: 'Type IV (Olive)' },
    { value: 'type5', label: 'Type V (Brown)' },
    { value: 'type6', label: 'Type VI (Black)' },
] as const;

// Medical Conditions
export const MEDICAL_CONDITIONS = [
    { value: 'skin-cancer', label: 'Önceki cilt kanseri' },
    { value: 'melanoma-family', label: 'Ailede melanom öyküsü' },
    { value: 'immunosuppressive', label: 'Bağışıklık baskılayıcı ilaçlar' },
    { value: 'sun-exposure', label: 'Aşırı güneş maruziyeti' },
] as const;
