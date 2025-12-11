/**
 * GlassCard Component
 * Cross-platform glassmorphism card that works correctly on both iOS and Android
 * On iOS: Uses BlurView for true glassmorphism effect
 * On Android: Uses a translucent View (BlurView has clipping issues on Android)
 */

import React, { ReactNode } from 'react';
import { View, Platform, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
    children: ReactNode;
    intensity?: number;
    style?: StyleProp<ViewStyle>;
    innerStyle?: StyleProp<ViewStyle>;
    borderRadius?: number;
}

export function GlassCard({
    children,
    intensity = 65,
    style,
    innerStyle,
    borderRadius = 18,
}: GlassCardProps) {
    // On Android, use a simple translucent View
    if (Platform.OS === 'android') {
        return (
            <View
                style={[
                    styles.androidContainer,
                    { borderRadius },
                    style,
                    {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)', // More visible translucent background
                        borderRadius, // Ensure borderRadius wins
                        overflow: 'hidden', // Ensure clipping wins
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                    }
                ]}
            >
                <View style={[styles.androidInner, innerStyle, { borderRadius, backgroundColor: 'transparent' }]}>
                    {children}
                </View>
            </View>
        );
    }

    // On iOS, use BlurView for the true glassmorphism effect
    return (
        <BlurView
            intensity={intensity}
            tint="light"
            style={[
                styles.iosBlur,
                { borderRadius },
                style,
            ]}
        >
            <View style={[styles.iosInner, innerStyle]}>
                {children}
            </View>
        </BlurView>
    );
}

const styles = StyleSheet.create({
    // Android styles
    androidContainer: {
        overflow: 'hidden',
    },
    androidInner: {
        backgroundColor: 'transparent',
    },

    // iOS styles - BlurView with glassmorphism
    iosBlur: {
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    iosInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
});
