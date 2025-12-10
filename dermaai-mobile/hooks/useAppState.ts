/**
 * useAppState Hook
 * Tracks app state (active, background, inactive) and provides callbacks for transitions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppStateOptions {
    onForeground?: () => void;
    onBackground?: () => void;
}

interface UseAppStateReturn {
    appState: AppStateStatus;
    isActive: boolean;
    isBackground: boolean;
    wasInBackground: boolean;
}

export function useAppState(options: UseAppStateOptions = {}): UseAppStateReturn {
    const { onForeground, onBackground } = options;
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const [wasInBackground, setWasInBackground] = useState(false);

    const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
        const prevState = appStateRef.current;

        // App came to foreground from background
        if (
            (prevState === 'background' || prevState === 'inactive') &&
            nextAppState === 'active'
        ) {
            setWasInBackground(true);
            onForeground?.();
        }

        // App went to background
        if (
            prevState === 'active' &&
            (nextAppState === 'background' || nextAppState === 'inactive')
        ) {
            onBackground?.();
        }

        appStateRef.current = nextAppState;
        setAppState(nextAppState);
    }, [onForeground, onBackground]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [handleAppStateChange]);

    // Reset wasInBackground flag after a short delay
    useEffect(() => {
        if (wasInBackground) {
            const timer = setTimeout(() => {
                setWasInBackground(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [wasInBackground]);

    return {
        appState,
        isActive: appState === 'active',
        isBackground: appState === 'background' || appState === 'inactive',
        wasInBackground,
    };
}
