/**
 * Language Context - Manages app-wide language state
 * Supports Turkish (tr) and English (en)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'tr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'dermaai_language';

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>('tr');
    const [isLoading, setIsLoading] = useState(true);

    // Load saved language preference on mount
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLanguage === 'tr' || savedLanguage === 'en') {
                    setLanguageState(savedLanguage);
                }
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
