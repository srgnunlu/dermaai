/**
 * Login screen for DermaAssistAI
 * Features Google OAuth login with professional medical branding
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/constants/Config';
import { saveTokens, saveUserData } from '@/lib/storage';
import { queryClient } from '@/lib/queryClient';
import { StatusBar } from 'expo-status-bar';

// Register WebBrowser for auth redirects
WebBrowser.maybeCompleteAuthSession();



export default function LoginScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { isAuthenticated, loginWithGoogle, isLoggingIn } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    // Setup redirect URI for server-based OAuth flow
    // Server will redirect back to this URL with tokens
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'dermaai',
        path: 'oauth',
    });

    console.log('[Auth] Generated Redirect URI:', redirectUri);

    const handleGoogleLogin = async () => {
        setIsLoading(true);

        try {
            // Use server-based OAuth flow
            // Server handles Google OAuth and redirects back to mobile app with JWT tokens
            const authUrl = `${API_BASE_URL}/api/auth/google?mobile=true&redirect_uri=${encodeURIComponent(redirectUri)}`;

            console.log('[Auth] Opening server OAuth URL:', authUrl);

            // Open browser for login - server will handle OAuth and redirect back
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

            console.log('[Auth] WebBrowser result:', result.type);

            if (result.type === 'success' && result.url) {
                console.log('[Auth] Received callback URL:', result.url);

                // Extract tokens from URL query params
                // Server redirects to: dermaai://oauth?access_token=xxx&refresh_token=xxx
                const urlParts = result.url.split('?');
                if (urlParts.length > 1) {
                    const params = new URLSearchParams(urlParts[1]);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        console.log('[Auth] Tokens received, saving...');

                        // Save tokens
                        await saveTokens(accessToken, refreshToken);

                        // Fetch user data
                        const userResponse = await fetch(`${API_BASE_URL}/api/auth/mobile/user`, {
                            headers: { 'Authorization': `Bearer ${accessToken}` },
                        });

                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            await saveUserData(userData);

                            // Update React Query cache so useAuth picks up the change
                            queryClient.setQueryData(['auth', 'user'], userData);

                            console.log('[Auth] Login successful, navigating to tabs');
                            router.replace('/(tabs)');
                        } else {
                            // Token might still be valid, try to navigate anyway
                            console.log('[Auth] Could not fetch user, but tokens received');
                            // Force refetch auth state
                            await queryClient.invalidateQueries({ queryKey: ['auth'] });
                            router.replace('/(tabs)');
                        }
                    } else {
                        // Check for error
                        const error = params.get('error');
                        if (error) {
                            Alert.alert('Giriş Hatası', `Hata: ${error}`);
                        } else {
                            Alert.alert('Giriş Hatası', 'Token alınamadı. Lütfen tekrar deneyin.');
                        }
                    }
                }
            } else if (result.type === 'cancel') {
                console.log('[Auth] User cancelled login');
            } else if (result.type === 'dismiss') {
                console.log('[Auth] Browser dismissed');
            }
        } catch (error) {
            console.error('[Auth] Login error:', error);
            Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrivacyPolicy = () => {
        router.push('/privacy-policy');
    };

    const handleTerms = () => {
        router.push('/terms-of-service');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo & Branding */}
                <View style={styles.brandSection}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
                        <Text style={styles.logoEmoji}>🩺</Text>
                    </View>

                    <Text style={[styles.appName, { color: colors.text }]}>
                        DermaAssistAI
                    </Text>

                    <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                        AI Destekli Dermatolojik Tanı Sistemi
                    </Text>
                </View>

                {/* Features */}
                <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <FeatureItem
                        emoji="🧠"
                        title="Akıllı AI Analizi"
                        description="DermAI ile kapsamlı tanı desteği"
                        colors={colors}
                    />
                    <FeatureItem
                        emoji="📊"
                        title="Detaylı Raporlama"
                        description="PDF formatında tanı raporları"
                        colors={colors}
                    />
                    <FeatureItem
                        emoji="🔒"
                        title="Güvenli Veri"
                        description="HIPAA uyumlu veri koruma"
                        colors={colors}
                    />
                </View>

                {/* Login Button */}
                <View style={styles.loginSection}>
                    <TouchableOpacity
                        style={[
                            styles.googleButton,
                            { backgroundColor: '#FFFFFF', borderColor: colors.border },
                        ]}
                        onPress={handleGoogleLogin}
                        disabled={isLoading || isLoggingIn}
                        activeOpacity={0.8}
                    >
                        {/* Google Icon */}
                        <View style={styles.googleIconContainer}>
                            <Text style={styles.googleIcon}>G</Text>
                        </View>
                        <Text style={styles.googleButtonText}>
                            {isLoading || isLoggingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
                        Sağlık profesyonelleri için tasarlanmıştır.{'\n'}
                        Devam ederek şartları ve gizlilik politikasını kabul etmiş olursunuz.
                    </Text>
                </View>

                {/* Footer Links */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handlePrivacyPolicy}>
                        <Text style={[styles.footerLink, { color: colors.primary }]}>
                            Gizlilik Politikası
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.footerDivider, { color: colors.textMuted }]}>•</Text>
                    <TouchableOpacity onPress={handleTerms}>
                        <Text style={[styles.footerLink, { color: colors.primary }]}>
                            Kullanım Şartları
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

// Feature item component
function FeatureItem({
    emoji,
    title,
    description,
    colors,
}: {
    emoji: string;
    title: string;
    description: string;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>{emoji}</Text>
            <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {description}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: 80,
        paddingBottom: Spacing['3xl'],
    },
    brandSection: {
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    logoEmoji: {
        fontSize: 48,
    },
    appName: {
        ...Typography.styles.h1,
        marginBottom: Spacing.sm,
    },
    tagline: {
        ...Typography.styles.body,
        textAlign: 'center',
    },
    featuresCard: {
        borderRadius: Spacing.radius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing['3xl'],
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    featureEmoji: {
        fontSize: 28,
        marginRight: Spacing.md,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        ...Typography.styles.label,
        marginBottom: 2,
    },
    featureDescription: {
        ...Typography.styles.caption,
    },
    loginSection: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 56,
        borderRadius: Spacing.radius.lg,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    googleIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4285F4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    googleIcon: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    googleButtonText: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: '600',
    },
    disclaimer: {
        ...Typography.styles.caption,
        textAlign: 'center',
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLink: {
        ...Typography.styles.caption,
        fontWeight: '500',
    },
    footerDivider: {
        marginHorizontal: Spacing.sm,
    },
});
