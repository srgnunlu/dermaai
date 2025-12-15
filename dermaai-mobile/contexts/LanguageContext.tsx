/**
 * Language Context - Manages app-wide language state
 * Supports Turkish (tr) and English (en)
 * Automatically detects device language on first launch
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

type Language = 'tr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'corio_language';

/**
 * Get the device's preferred language
 * Returns 'tr' for Turkish devices, 'en' for all other languages
 */
const getDeviceLanguage = (): Language => {
    try {
        const locales = Localization.getLocales();
        const deviceLanguageCode = locales[0]?.languageCode?.toLowerCase();
        return deviceLanguageCode === 'tr' ? 'tr' : 'en';
    } catch (error) {
        console.error('Failed to get device language:', error);
        return 'en'; // Default to English if detection fails
    }
};

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>(() => getDeviceLanguage());
    const [isLoading, setIsLoading] = useState(true);

    // Load saved language preference on mount, fallback to device language
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLanguage === 'tr' || savedLanguage === 'en') {
                    setLanguageState(savedLanguage);
                }
                // If no saved preference, keep the device language (already set in initial state)
            } catch (error) {
                console.error('Failed to load language preference:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLanguage();
    }, []);

    // Save language preference when changed
    const setLanguage = async (lang: Language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            setLanguageState(lang);
        } catch (error) {
            console.error('Failed to save language preference:', error);
            setLanguageState(lang); // Still update state even if save fails
        }
    };

    // Toggle between languages
    const toggleLanguage = () => {
        setLanguage(language === 'tr' ? 'en' : 'tr');
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                toggleLanguage,
                isLoading,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Helper hook to get translated strings
export function useTranslation() {
    const { language } = useLanguage();

    const t = (key: string, translations: { tr: string; en: string }) => {
        return translations[language] || translations.en;
    };

    return { t, language };
}
