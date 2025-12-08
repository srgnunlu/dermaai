/**
 * Tab Bar Visibility Context
 * Controls animated hide/show of tab bar during wizard flow
 */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

interface TabBarVisibilityContextType {
    isVisible: boolean;
    translateY: Animated.Value;
    hideTabBar: () => void;
    showTabBar: () => void;
    toggleTabBar: () => void;
    showTabBarTemporarily: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | undefined>(undefined);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isWizardActive, setIsWizardActive] = useState(false);
    const translateY = useRef(new Animated.Value(0)).current;
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear any existing timer
    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const hideTabBar = useCallback(() => {
        clearHideTimer();
        setIsVisible(false);
        setIsWizardActive(true);
        Animated.spring(translateY, {
            toValue: 150, // Move down off screen
            useNativeDriver: true,
            friction: 8,
            tension: 40,
        }).start();
    }, [translateY, clearHideTimer]);

    const showTabBar = useCallback(() => {
        clearHideTimer();
        setIsVisible(true);
        setIsWizardActive(false);
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
        }).start();
    }, [translateY, clearHideTimer]);

    // Show tab bar temporarily (with auto-hide after 3 seconds)
    const showTabBarTemporarily = useCallback(() => {
        clearHideTimer();
        setIsVisible(true);
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
        }).start();

        // Auto-hide after 3 seconds if still in wizard mode
        hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            Animated.spring(translateY, {
                toValue: 150,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();
        }, 3000);
    }, [translateY, clearHideTimer]);

    const toggleTabBar = useCallback(() => {
        if (isVisible) {
            hideTabBar();
        } else {
            if (isWizardActive) {
                showTabBarTemporarily();
            } else {
                showTabBar();
            }
        }
    }, [isVisible, isWizardActive, hideTabBar, showTabBar, showTabBarTemporarily]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            clearHideTimer();
        };
    }, [clearHideTimer]);

    return (
        <TabBarVisibilityContext.Provider
            value={{
                isVisible,
                translateY,
                hideTabBar,
                showTabBar,
                toggleTabBar,
                showTabBarTemporarily,
            }}
        >
            {children}
        </TabBarVisibilityContext.Provider>
    );
}

export function useTabBarVisibility() {
    const context = useContext(TabBarVisibilityContext);
    if (!context) {
        throw new Error('useTabBarVisibility must be used within TabBarVisibilityProvider');
    }
    return context;
}
