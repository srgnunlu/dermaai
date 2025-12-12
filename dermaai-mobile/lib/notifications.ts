/**
 * Notification Service
 * Handles push notifications using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Storage keys
const NOTIFICATION_SETTINGS_KEY = 'corio_notification_settings';
const NOTIFICATION_TOKEN_KEY = 'corio_push_token';

// Types
export interface NotificationSettings {
    analysisNotifications: boolean;
    urgentAlerts: boolean;
    soundEnabled: boolean;
    skinCheckReminderEnabled: boolean;
    skinCheckReminderTime: string; // HH:mm format
}

export const defaultNotificationSettings: NotificationSettings = {
    analysisNotifications: true,
    urgentAlerts: true,
    soundEnabled: false,
    skinCheckReminderEnabled: false,
    skinCheckReminderTime: '20:00',
};

// Notification identifiers
const SKIN_CHECK_REMINDER_ID = 'skin-check-reminder';

/**
 * Get Expo Push Token for remote notifications
 * @returns Push token string or undefined if not available
 */
export async function getExpoPushToken(): Promise<string | undefined> {
    try {
        // Check if this is a physical device
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return undefined;
        }

        // Get project ID from app config
        const projectId = Constants.expoConfig?.extra?.eas?.projectId
            ?? Constants.easConfig?.projectId;

        if (!projectId) {
            console.log('No Expo project ID found');
            return undefined;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        console.log('Expo push token:', tokenData.data);
        return tokenData.data;
    } catch (error) {
        console.error('Error getting Expo push token:', error);
        return undefined;
    }
}

/**
 * Register push token with backend
 * Call this after successful login and permission grant
 */
export async function registerPushTokenWithBackend(): Promise<boolean> {
    try {
        // First check/request permissions
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
            const granted = await requestNotificationPermissions();
            if (!granted) {
                console.log('Notification permission not granted');
                return false;
            }
        }

        // Get push token
        const token = await getExpoPushToken();
        if (!token) {
            console.log('Could not get push token');
            return false;
        }

        // Check if already registered
        const storedToken = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
        if (storedToken === token) {
            console.log('Push token already registered');
            return true;
        }

        // Register with backend
        await api.post('/api/push-tokens', {
            token,
            platform: Platform.OS,
            deviceId: Constants.deviceId,
        });

        // Save locally
        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
        console.log('Push token registered with backend');
        return true;
    } catch (error) {
        console.error('Error registering push token:', error);
        return false;
    }
}

/**
 * Unregister push token from backend
 * Call this on logout
 */
export async function unregisterPushToken(): Promise<void> {
    try {
        // Delete all tokens for current user (backend handles this)
        await api.delete('/api/push-tokens');
        await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
        console.log('Push token unregistered');
    } catch (error) {
        console.error('Error unregistering push token:', error);
    }
}

/**
 * Request notification permissions
 * @returns Promise with granted status
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permission denied');
            return false;
        }

        // Configure Android channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Varsayılan',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#0891B2',
            });

            await Notifications.setNotificationChannelAsync('urgent', {
                name: 'Acil Uyarılar',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 500, 500],
                lightColor: '#EF4444',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
}

/**
 * Schedule daily skin check reminder
 * @param hour - Hour of the day (0-23)
 * @param minute - Minute (0-59)
 * @param language - 'tr' or 'en'
 */
export async function scheduleSkinCheckReminder(
    hour: number = 20,
    minute: number = 0,
    language: 'tr' | 'en' = 'tr'
): Promise<string | undefined> {
    try {
        // Cancel existing reminder first
        await cancelSkinCheckReminder();

        const title = language === 'tr'
            ? '🔍 Cilt Kontrolü Zamanı'
            : '🔍 Time for Skin Check';

        const body = language === 'tr'
            ? 'Lezyonlarınızı kontrol edin ve değişiklik varsa kaydedin.'
            : 'Check your skin for any changes and record them if needed.';

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { type: 'skin-check-reminder' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
            identifier: SKIN_CHECK_REMINDER_ID,
        });

        console.log('Skin check reminder scheduled:', identifier);
        return identifier;
    } catch (error) {
        console.error('Error scheduling skin check reminder:', error);
        return undefined;
    }
}

/**
 * Cancel skin check reminder
 */
export async function cancelSkinCheckReminder(): Promise<void> {
    try {
        await Notifications.cancelScheduledNotificationAsync(SKIN_CHECK_REMINDER_ID);
        console.log('Skin check reminder cancelled');
    } catch (error) {
        console.error('Error cancelling skin check reminder:', error);
    }
}

/**
 * Send immediate notification (for analysis complete, urgent alerts, etc.)
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data
 * @param urgent - Use urgent channel on Android
 */
export async function sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    urgent: boolean = false
): Promise<string | undefined> {
    try {
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: urgent
                    ? Notifications.AndroidNotificationPriority.MAX
                    : Notifications.AndroidNotificationPriority.HIGH,
                data: data || {},
                ...(Platform.OS === 'android' && urgent && { channelId: 'urgent' }),
            },
            trigger: null, // Immediate
        });

        return identifier;
    } catch (error) {
        console.error('Error sending notification:', error);
        return undefined;
    }
}

/**
 * Send analysis complete notification
 * @param language - 'tr' or 'en'
 * @param caseId - Case ID for navigation
 */
export async function sendAnalysisCompleteNotification(
    language: 'tr' | 'en' = 'tr',
    caseId?: string
): Promise<void> {
    const title = language === 'tr'
        ? '✅ Analiz Tamamlandı'
        : '✅ Analysis Complete';

    const body = language === 'tr'
        ? 'AI analizi tamamlandı. Sonuçları görüntüleyin.'
        : 'AI analysis is complete. View your results.';

    await sendImmediateNotification(title, body, {
        type: 'analysis-complete',
        caseId
    });
}

/**
 * Send urgent alert notification
 * @param language - 'tr' or 'en'
 * @param message - Custom message
 */
export async function sendUrgentAlert(
    language: 'tr' | 'en' = 'tr',
    message?: string
): Promise<void> {
    const title = language === 'tr'
        ? '🚨 Acil Uyarı'
        : '🚨 Urgent Alert';

    const body = message || (language === 'tr'
        ? 'Dikkat! Bir dermatoloğa danışmanız önerilir.'
        : 'Attention! Consulting a dermatologist is recommended.');

    await sendImmediateNotification(title, body, { type: 'urgent-alert' }, true);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('All notifications cancelled');
    } catch (error) {
        console.error('Error cancelling all notifications:', error);
    }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Save notification settings to AsyncStorage
 */
export async function saveNotificationSettings(
    settings: NotificationSettings
): Promise<void> {
    try {
        await AsyncStorage.setItem(
            NOTIFICATION_SETTINGS_KEY,
            JSON.stringify(settings)
        );
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
}

/**
 * Load notification settings from AsyncStorage
 */
export async function loadNotificationSettings(): Promise<NotificationSettings> {
    try {
        const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (stored) {
            return { ...defaultNotificationSettings, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Error loading notification settings:', error);
    }
    return defaultNotificationSettings;
}

/**
 * Setup notification listeners
 * @param onNotificationReceived - Callback when notification is received
 * @param onNotificationResponse - Callback when user interacts with notification
 * @returns Cleanup function
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('Notification received:', notification);
            onNotificationReceived?.(notification);
        }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            console.log('Notification response:', response);
            onNotificationResponse?.(response);
        }
    );

    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}
