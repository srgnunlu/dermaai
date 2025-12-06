import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { APP_NAME } from '@/constants/Config';
import { saveTokens } from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = 'https://dermaai-1d9i.onrender.com';

export default function LoginScreen() {
    const { isLoggingIn, refetch } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    // Handle deep link when app is opened with oauth callback
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const url = event.url;
            console.log('Deep link received:', url);

            if (url.includes('oauth')) {
                const params = Linking.parse(url);
                const accessToken = params.queryParams?.access_token as string;
                const refreshToken = params.queryParams?.refresh_token as string;

                if (accessToken && refreshToken) {
                    console.log('Tokens received, saving...');
                    await saveTokens(accessToken, refreshToken);
                    // Refresh auth state
                    await refetch();
                    queryClient.invalidateQueries({ queryKey: ['auth'] });
                }
            }
        };

        // Listen for deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened with a deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            subscription.remove();
        };
    }, [refetch, queryClient]);

    const handleGooglePress = async () => {
        setLoading(true);

        // Add mobile=true to trigger mobile redirect
        const authUrl = `${BACKEND_URL}/api/auth/google?mobile=true`;

        try {
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                'dermaai://oauth'
            );

            console.log('Auth result:', result);

            if (result.type === 'success' && result.url) {
                // Parse tokens from redirect URL
                const params = Linking.parse(result.url);
                const accessToken = params.queryParams?.access_token as string;
                const refreshToken = params.queryParams?.refresh_token as string;

                if (accessToken && refreshToken) {
                    await saveTokens(accessToken, refreshToken);
                    await refetch();
                    queryClient.invalidateQueries({ queryKey: ['auth'] });
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            Alert.alert('Hata', 'Giriş yapılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={styles.logo}>🩺</Text>
                <Text style={[styles.title, { color: colors.text }]}>{APP_NAME}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    AI-Powered Dermatology Assistant
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGooglePress}
                    disabled={isLoggingIn || loading}
                >
                    {(isLoggingIn || loading) ? (
                        <ActivityIndicator color="#4285F4" />
                    ) : (
                        <>
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.googleButtonText}>
                                Google ile Giriş Yap
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                Bu sistem eğitim/demo amaçlıdır.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    buttonContainer: {
        marginBottom: 24,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        height: 56,
        borderRadius: 28,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#dadce0',
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4285F4',
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3c4043',
    },
    disclaimer: {
        fontSize: 12,
        textAlign: 'center',
    },
});
