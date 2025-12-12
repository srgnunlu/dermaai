/**
 * Push Notification Service
 * Sends push notifications via Expo Push API
 */

import logger from './logger';

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
    to: string;
    title: string;
    body: string;
    sound?: 'default' | null;
    data?: Record<string, unknown>;
    priority?: 'default' | 'normal' | 'high';
    channelId?: string;
    badge?: number;
}

interface ExpoPushTicket {
    id?: string;
    status: 'ok' | 'error';
    message?: string;
    details?: {
        error?: string;
    };
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
        sound?: boolean;
        priority?: 'default' | 'normal' | 'high';
        channelId?: string;
    }
): Promise<ExpoPushTicket | null> {
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
        logger.warn('Invalid push token:', pushToken);
        return null;
    }

    const message: ExpoPushMessage = {
        to: pushToken,
        title,
        body,
        sound: options?.sound !== false ? 'default' : null,
        data,
        priority: options?.priority || 'high',
        channelId: options?.channelId,
    };

    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();
        const ticket = result.data?.[0] as ExpoPushTicket;

        if (ticket?.status === 'error') {
            logger.error('Push notification failed:', ticket.message, ticket.details);
        } else {
            logger.info('Push notification sent successfully:', ticket?.id);
        }

        return ticket;
    } catch (error) {
        logger.error('Error sending push notification:', error);
        return null;
    }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendPushNotifications(
    pushTokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
        sound?: boolean;
        priority?: 'default' | 'normal' | 'high';
        channelId?: string;
    }
): Promise<ExpoPushTicket[]> {
    // Filter valid tokens
    const validTokens = pushTokens.filter(
        (token) => token && token.startsWith('ExponentPushToken')
    );

    if (validTokens.length === 0) {
        logger.warn('No valid push tokens provided');
        return [];
    }

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token,
        title,
        body,
        sound: options?.sound !== false ? 'default' : null,
        data,
        priority: options?.priority || 'high',
        channelId: options?.channelId,
    }));

    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();
        const tickets = result.data as ExpoPushTicket[];

        // Log any errors
        tickets.forEach((ticket, index) => {
            if (ticket.status === 'error') {
                logger.error(`Push notification failed for token ${index}:`, ticket.message);
            }
        });

        logger.info(`Sent ${tickets.filter((t) => t.status === 'ok').length}/${tickets.length} push notifications`);

        return tickets;
    } catch (error) {
        logger.error('Error sending push notifications:', error);
        return [];
    }
}

/**
 * Send analysis complete notification
 */
export async function sendAnalysisCompleteNotification(
    pushTokens: string[],
    caseId: string,
    language: 'tr' | 'en' = 'tr'
): Promise<void> {
    const title = language === 'tr'
        ? '✅ Analiz Tamamlandı'
        : '✅ Analysis Complete';

    const body = language === 'tr'
        ? 'AI analizi tamamlandı. Sonuçları görüntüleyin.'
        : 'AI analysis is complete. View your results.';

    await sendPushNotifications(pushTokens, title, body, {
        type: 'analysis-complete',
        caseId,
    });
}

/**
 * Send urgent alert notification
 */
export async function sendUrgentAlertNotification(
    pushTokens: string[],
    message: string,
    language: 'tr' | 'en' = 'tr'
): Promise<void> {
    const title = language === 'tr'
        ? '🚨 Acil Uyarı'
        : '🚨 Urgent Alert';

    await sendPushNotifications(
        pushTokens,
        title,
        message,
        { type: 'urgent-alert' },
        { priority: 'high', channelId: 'urgent' }
    );
}
