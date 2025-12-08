/**
 * Lesion Location Step - Premium Compact Design
 * Visual body location selector with professional icons
 * Designed to fit on a single screen without scrolling
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    ArrowRight,
    Check,
    // Body part icons - more relevant choices
    Smile,          // Yüz - face/smile
    CircleUser,     // Saçlı Deri - head/scalp
    Circle,         // Boyun - neck area
    Shirt,          // Göğüs - chest/torso
    FlipVertical2,  // Sırt - back
    CircleDot,      // Karın - abdomen
    Dumbbell,       // Kollar - arms
    Hand,           // Eller - hands
    ArrowDownUp,    // Bacaklar - legs
    Footprints,     // Ayaklar - feet
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LesionLocationStepProps {
    selectedLocations: string[];
    onLocationsChange: (locations: string[]) => void;
    onNext: () => void;
    onBack: () => void;
    canProceed: boolean;
}

// Body location options with professional lucide icons
const getLocationOptions = (language: 'tr' | 'en') => [
    { id: 'face', label: Translations.face[language], IconComponent: Smile },
    { id: 'scalp', label: language === 'tr' ? 'Saçlı Deri' : 'Scalp', IconComponent: CircleUser },
    { id: 'neck', label: Translations.neck[language], IconComponent: Circle },
    { id: 'chest', label: Translations.chest[language], IconComponent: Shirt },
    { id: 'back', label: Translations.bodyBack[language], IconComponent: FlipVertical2 },
    { id: 'abdomen', label: Translations.abdomen[language], IconComponent: CircleDot },
    { id: 'arms', label: Translations.arms[language], IconComponent: Dumbbell },
    { id: 'hands', label: Translations.hands[language], IconComponent: Hand },
    { id: 'legs', label: Translations.legs[language], IconComponent: ArrowDownUp },
    { id: 'feet', label: Translations.feet[language], IconComponent: Footprints },
];

// Calculate card dimensions for 2-column grid that fits the screen
const HORIZONTAL_PADDING = 24;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;
const CARD_HEIGHT = 80; // Taller for vertical layout

// Location card component
const LocationCard = ({
    location,
    selected,
    onPress,
    index,
    colors,
    gradients,
}: {
    location: { id: string; label: string; IconComponent: any };
    selected: boolean;
    onPress: () => void;
    index: number;
    colors: typeof Colors.light;
    gradients: typeof Gradients.light | typeof Gradients.dark;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const IconComponent = location.IconComponent;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: Duration.fast,
            delay: index * 30,
            useNativeDriver: true,
        }).start();
    }, []);

    const handlePress = async () => {
        await Haptics.selectionAsync();
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 40,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();
        onPress();
    };

    if (selected) {
        return (
            <Animated.View
                style={[
                    styles.locationCardWrapper,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                ]}
            >
                <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.locationCardSelected}
                    >
                        <View style={styles.checkBadge}>
                            <Check size={10} color={colors.primary} strokeWidth={3} />
                        </View>
                        <View style={styles.cardContentVertical}>
                            <View style={styles.iconContainerSelected}>
                                <IconComponent size={22} color="#FFFFFF" strokeWidth={1.8} />
                            </View>
                            <Text style={styles.locationLabelSelected}>{location.label}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.locationCardWrapper,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
        >
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
                <BlurView intensity={60} tint="light" style={styles.locationCardBlur}>
                    <View style={styles.locationCard}>
                        <View style={styles.cardContentVertical}>
                            <View style={styles.iconContainer}>
                                <IconComponent size={22} color="#0891B2" strokeWidth={1.8} />
                            </View>
                            <Text style={styles.locationLabel}>{location.label}</Text>
                        </View>
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

export function LesionLocationStep({
    selectedLocations,
    onLocationsChange,
    onNext,
    onBack,
    canProceed,
}: LesionLocationStepProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const { language } = useLanguage();
    const LOCATION_OPTIONS = getLocationOptions(language);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: Duration.normal,
            useNativeDriver: true,
        }).start();
    }, []);

    const toggleLocation = async (locationId: string) => {
        if (selectedLocations.includes(locationId)) {
            onLocationsChange(selectedLocations.filter(id => id !== locationId));
        } else {
            onLocationsChange([...selectedLocations, locationId]);
        }
    };

    const handlePressIn = () => {
        Animated.spring(buttonScaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    const handleNext = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onNext();
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.appName, { color: colors.textSecondary }]}>
                    DermaAssist<Text style={{ color: colors.primary }}>AI</Text>
                </Text>
                <View style={styles.headerRight} />
            </View>

            {/* Content - No ScrollView for single screen */}
            <View style={styles.content}>
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {Translations.selectLocation[language]}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {Translations.tapToSelect[language]}
                    </Text>
                </View>

                {/* Location Grid - 2 columns, 5 rows */}
                <View style={styles.locationGrid}>
                    {LOCATION_OPTIONS.map((location, index) => (
                        <LocationCard
                            key={location.id}
                            location={location}
                            selected={selectedLocations.includes(location.id)}
                            onPress={() => toggleLocation(location.id)}
                            index={index}
                            colors={colors}
                            gradients={gradients}
                        />
                    ))}
                </View>

                {/* Selected count indicator */}
                {selectedLocations.length > 0 && (
                    <View style={[styles.selectedBadge, { backgroundColor: `${colors.success}20` }]}>
                        <Check size={14} color={colors.success} strokeWidth={2.5} />
                        <Text style={[styles.selectedText, { color: colors.success }]}>
                            {language === 'tr'
                                ? `${selectedLocations.length} bölge seçildi`
                                : `${selectedLocations.length} area(s) selected`}
                        </Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Animated.View style={[styles.footerButton, { transform: [{ scale: buttonScaleAnim }] }]}>
                    <TouchableOpacity
                        onPress={handleNext}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={!canProceed}
                        activeOpacity={1}
                    >
                        <LinearGradient
                            colors={canProceed ? gradients.primary : ['rgba(200,200,200,0.5)', 'rgba(200,200,200,0.5)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueButton}
                        >
                            <Text style={[styles.continueButtonText, { opacity: canProceed ? 1 : 0.5 }]}>
                                {Translations.next[language]}
                            </Text>
                            <ArrowRight size={20} color="#FFFFFF" style={{ opacity: canProceed ? 1 : 0.5 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: Spacing.sm,
    },
    appName: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: HORIZONTAL_PADDING,
        justifyContent: 'flex-start',
    },
    titleSection: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
    },
    locationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
    },
    locationCardWrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    locationCardBlur: {
        height: CARD_HEIGHT,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    locationCard: {
        height: CARD_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    locationCardSelected: {
        height: CARD_HEIGHT,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    cardContentVertical: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(8, 145, 178, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerSelected: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    locationLabelSelected: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: 10,
        paddingHorizontal: Spacing.md,
        borderRadius: 10,
        marginTop: Spacing.md,
        alignSelf: 'center',
    },
    selectedText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    footerButton: {
        width: '100%',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: Spacing.sm,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
