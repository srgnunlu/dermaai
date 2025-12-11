/**
 * Login screen for Corio Scan
 * Premium Glassmorphism Design with Google OAuth login
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ImageBackground,
    Animated,
    Easing,
    Dimensions,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Stethoscope, Brain, FileText, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/constants/Config';
import { saveTokens, saveUserData } from '@/lib/storage';
import { queryClient } from '@/lib/queryClient';
import { StatusBar } from 'expo-status-bar';
import { LegalTextModal } from '@/components/ui/LegalTextModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Register WebBrowser for auth redirects
WebBrowser.maybeCompleteAuthSession();

// Feature item component with glassmorphism
function FeatureItem({
    icon: Icon,
    title,
    description,
    index,
}: {
    icon: any;
    title: string;
    description: string;
    index: number;
}) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 400 + index * 150,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: 400 + index * 150,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.featureItem,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={styles.featureIconContainer}>
                <Icon size={22} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>{description}</Text>
            </View>
        </Animated.View>
    );
}

export default function LoginScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { language, toggleLanguage } = useLanguage();
    const { isAuthenticated, loginWithGoogle, isLoggingIn } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [legalModalVisible, setLegalModalVisible] = useState(false);
    const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    // Start animations
    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Shimmer animation - slow, subtle horizontal sweep
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 3500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation - gentle breathing effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Glow animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.5,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Shimmer translate interpolation
    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    // Setup redirect URI for server-based OAuth flow
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'corioscan',
        path: 'oauth',
    });

    console.log('[Auth] Generated Redirect URI:', redirectUri);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const authUrl = `${API_BASE_URL}/api/auth/google?mobile=true&redirect_uri=${encodeURIComponent(redirectUri)}`;
            console.log('[Auth] Opening server OAuth URL:', authUrl);

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            console.log('[Auth] WebBrowser result:', result.type);

            if (result.type === 'success' && result.url) {
                console.log('[Auth] Received callback URL:', result.url);

                const urlParts = result.url.split('?');
                if (urlParts.length > 1) {
                    const params = new URLSearchParams(urlParts[1]);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        console.log('[Auth] Tokens received, saving...');
                        await saveTokens(accessToken, refreshToken);

                        const userResponse = await fetch(`${API_BASE_URL}/api/auth/mobile/user`, {
                            headers: { 'Authorization': `Bearer ${accessToken}` },
                        });

                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            await saveUserData(userData);
                            queryClient.setQueryData(['auth', 'user'], userData);
                            console.log('[Auth] Login successful, navigating to tabs');
                            router.replace('/(tabs)');
                        } else {
                            console.log('[Auth] Could not fetch user, but tokens received');
                            await queryClient.invalidateQueries({ queryKey: ['auth'] });
                            router.replace('/(tabs)');
                        }
                    } else {
                        const error = params.get('error');
                        if (error) {
                            Alert.alert(
                                language === 'tr' ? 'Giriş Hatası' : 'Login Error',
                                `${language === 'tr' ? 'Hata' : 'Error'}: ${error}`
                            );
                        } else {
                            Alert.alert(
                                language === 'tr' ? 'Giriş Hatası' : 'Login Error',
                                language === 'tr' ? 'Token alınamadı. Lütfen tekrar deneyin.' : 'Could not get token. Please try again.'
                            );
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
            Alert.alert(
                language === 'tr' ? 'Hata' : 'Error',
                language === 'tr' ? 'Giriş yapılırken bir hata oluştu.' : 'An error occurred during login.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handlePressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePrivacyPolicy = () => {
        setLegalModalType('privacy');
        setLegalModalVisible(true);
    };

    const handleTerms = () => {
        setLegalModalType('terms');
        setLegalModalVisible(true);
    };

    const features = [
        {
            icon: Brain,
            title: language === 'tr' ? 'Akıllı AI Analizi' : 'Smart AI Analysis',
            description: language === 'tr' ? 'Gelişmiş yapay zeka ile dermatolojik analiz' : 'Advanced AI dermatological analysis',
        },
        {
            icon: FileText,
            title: language === 'tr' ? 'Detaylı Raporlama' : 'Detailed Reporting',
            description: language === 'tr' ? 'PDF formatında profesyonel raporlar' : 'Professional reports in PDF format',
        },
        {
            icon: ShieldCheck,
            title: language === 'tr' ? 'Güvenli Veri' : 'Secure Data',
            description: language === 'tr' ? 'HIPAA uyumlu veri koruma' : 'HIPAA compliant data protection',
        },
    ];

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <StatusBar style="dark" />
            <View style={styles.overlay} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Language Toggle - Top Right */}
                <Animated.View style={[styles.languageToggleContainer, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleLanguage();
                        }}
                        style={styles.languageToggleWrapper}
                        activeOpacity={0.7}
                    >
                        <BlurView intensity={60} tint="light" style={styles.languageToggleBlur}>
                            <View style={styles.languageToggleInner}>
                                <Text style={styles.languageToggleText}>
                                    {language === 'tr' ? 'EN' : 'TR'}
                                </Text>
                            </View>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                {/* Logo & Branding with Glassmorphism */}
                <Animated.View
                    style={[
                        styles.brandSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <View style={styles.logoWrapper}>
                        <BlurView intensity={70} tint="light" style={styles.logoBlur}>
                            <View style={styles.logoGlassHighlight} />
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.3)', 'rgba(93, 213, 200, 0.4)', 'rgba(59, 178, 169, 0.5)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.logoContainer}
                            >
                                <Stethoscope size={48} color="#FFFFFF" strokeWidth={2} />
                            </LinearGradient>
                        </BlurView>
                    </View>

                    <Text style={styles.appName}>
                        Corio<Text style={styles.appNameHighlight}> Scan</Text>
                    </Text>

                    <View style={styles.taglineWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.taglineBlur}>
                            <View style={styles.taglineInner}>
                                <Sparkles size={14} color="#0891B2" strokeWidth={2.5} />
                                <Text style={styles.tagline}>
                                    {language === 'tr'
                                        ? 'AI Destekli Dermatolojik Tanı Sistemi'
                                        : 'AI-Powered Dermatological Diagnosis System'}
                                </Text>
                            </View>
                        </BlurView>
                    </View>
                </Animated.View>

                {/* Features with Glassmorphism */}
                <View style={styles.featuresWrapper}>
                    <BlurView intensity={60} tint="light" style={styles.featuresCardBlur}>
                        <View style={styles.featuresCard}>
                            {features.map((feature, index) => (
                                <FeatureItem
                                    key={index}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                    index={index}
                                />
                            ))}
                        </View>
                    </BlurView>
                </View>

                {/* Premium Google Login Button */}
                <Animated.View
                    style={[
                        styles.loginButtonWrapper,
                        {
                            transform: [{ scale: Animated.multiply(buttonScale, pulseAnim) }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPress={handleGoogleLogin}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={isLoading || isLoggingIn}
                        activeOpacity={1}
                        style={styles.loginButtonContainer}
                    >
                        <BlurView intensity={80} tint="light" style={styles.loginButtonBlur}>
                            <View style={styles.loginButtonGlassHighlight} />
                            <LinearGradient
                                colors={[
                                    'rgba(255, 255, 255, 0.25)',
                                    'rgba(93, 213, 200, 0.6)',
                                    'rgba(59, 178, 169, 0.7)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={styles.loginButton}
                            >
                                {/* Frost Overlay */}
                                <View style={styles.frostOverlay} />

                                {/* Shimmer Effect */}
                                <Animated.View
                                    style={[
                                        styles.shimmerOverlay,
                                        { transform: [{ translateX: shimmerTranslateX }] },
                                    ]}
                                    pointerEvents="none"
                                >
                                    <LinearGradient
                                        colors={[
                                            'transparent',
                                            'rgba(255, 255, 255, 0.15)',
                                            'rgba(200, 240, 235, 0.25)',
                                            'rgba(255, 255, 255, 0.15)',
                                            'transparent',
                                        ]}
                                        locations={[0, 0.3, 0.5, 0.7, 1]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.shimmerGradient}
                                    />
                                </Animated.View>

                                {/* Google Icon */}
                                <View style={styles.googleIconCircle}>
                                    <Text style={styles.googleIcon}>G</Text>
                                </View>

                                <Text style={styles.loginButtonText}>
                                    {isLoading || isLoggingIn
                                        ? (language === 'tr' ? 'Giriş yapılıyor...' : 'Signing in...')
                                        : (language === 'tr' ? 'Google ile Giriş Yap' : 'Sign in with Google')}
                                </Text>
                            </LinearGradient>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                {/* Disclaimer */}
                <Animated.View style={[styles.disclaimerWrapper, { opacity: fadeAnim }]}>
                    <BlurView intensity={40} tint="light" style={styles.disclaimerBlur}>
                        <Text style={styles.disclaimer}>
                            {language === 'tr'
                                ? 'Devam ederek şartları ve gizlilik politikasını kabul etmiş olursunuz.'
                                : 'By continuing, you agree to the terms and privacy policy.'}
                        </Text>
                    </BlurView>
                </Animated.View>

                {/* Footer Links */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <TouchableOpacity onPress={handlePrivacyPolicy}>
                        <Text style={styles.footerLink}>
                            {Translations.privacyPolicy[language]}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.footerDivider}>•</Text>
                    <TouchableOpacity onPress={handleTerms}>
                        <Text style={styles.footerLink}>
                            {Translations.termsOfService[language]}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Legal Text Modal */}
            <LegalTextModal
                visible={legalModalVisible}
                onClose={() => setLegalModalVisible(false)}
                type={legalModalType}
                language={language}
            />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: 70,
        paddingBottom: Spacing['3xl'],
    },

    // Language Toggle
    languageToggleContainer: {
        position: 'absolute',
        top: 55,
        right: Spacing.xl,
        zIndex: 10,
    },
    languageToggleWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    languageToggleBlur: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            ios: {},
        }),
    },
    languageToggleInner: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.25)',
        }),
    },
    languageToggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0891B2',
        letterSpacing: 0.5,
    },

    // Brand Section
    brandSection: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
        marginTop: Spacing.xl,
    },
    logoWrapper: {
        marginBottom: Spacing.lg,
        borderRadius: 50,
    },
    logoBlur: {
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            ios: {},
        }),
    },
    logoGlassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        zIndex: 1,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: Spacing.sm,
        letterSpacing: 0.5,
    },
    appNameHighlight: {
        color: '#0891B2',
    },
    taglineWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    taglineBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            ios: {},
        }),
    },
    taglineInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    tagline: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },

    // Features Card
    featuresWrapper: {
        marginBottom: Spacing['2xl'],
        borderRadius: 24,
    },
    featuresCardBlur: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            ios: {},
        }),
    },

    featuresCard: {
        padding: Platform.select({
            android: Spacing.lg,
            ios: Spacing.lg,
        }),
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.15)',
        }),
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Platform.select({
            android: Spacing.md,
            ios: Spacing.md,
        }),
        gap: Platform.select({
            android: Spacing.md,
            ios: Spacing.md,
        }),
    },
    featureIconContainer: {
        width: Platform.select({ android: 44, ios: 44 }),
        height: Platform.select({ android: 44, ios: 44 }),
        borderRadius: Platform.select({ android: 16, ios: 14 }),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0891B2',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: Platform.select({ android: 16, ios: 15 }),
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: Platform.select({ android: 4, ios: 2 }),
    },
    featureDescription: {
        fontSize: Platform.select({ android: 14, ios: 13 }),
        color: '#64748B',
        fontWeight: '400',
        lineHeight: Platform.select({ android: 20, ios: undefined }),
    },

    // Login Button
    loginButtonWrapper: {
        alignItems: 'center',
        width: '100%',
        marginBottom: Spacing.lg,
    },
    loginButtonContainer: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
    },
    loginButtonBlur: {
        borderRadius: 28,
        overflow: 'hidden',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            ios: {},
        }),
    },
    loginButtonGlassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        zIndex: 1,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: Platform.select({ android: 62, ios: 60 }),
        paddingHorizontal: 24,
        borderRadius: 28,
        gap: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        overflow: 'hidden',
    },
    frostOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 28,
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 160,
    },
    shimmerGradient: {
        flex: 1,
        width: 160,
    },
    googleIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    googleIcon: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: Platform.select({ android: 16, ios: 17 }),
        fontWeight: '700',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // Disclaimer
    disclaimerWrapper: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderRadius: 16,
        overflow: 'hidden',
    },
    disclaimerBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            ios: {},
        }),
    },
    disclaimer: {
        fontSize: Platform.select({ android: 13, ios: 12 }),
        color: '#64748B',
        textAlign: 'center',
        lineHeight: Platform.select({ android: 20, ios: 18 }),
        paddingHorizontal: Platform.select({ android: 24, ios: 20 }),
        paddingVertical: Platform.select({ android: 14, ios: 12 }),
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.1)',
        }),
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLink: {
        fontSize: Platform.select({ android: 14, ios: 13 }),
        fontWeight: '600',
        color: '#0891B2',
    },
    footerDivider: {
        fontSize: 13,
        color: '#94A3B8',
        marginHorizontal: Spacing.sm,
    },
});
