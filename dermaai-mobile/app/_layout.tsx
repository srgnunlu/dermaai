import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Asset } from 'expo-asset';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import { useColorScheme } from '@/components/useColorScheme';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { TabBarVisibilityProvider } from '@/contexts/TabBarVisibilityContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { registerPushTokenWithBackend } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';

// RevenueCat API Keys
const REVENUECAT_IOS_API_KEY = 'test_NVaCJScnTJldnjDHXLEQeiXAGXk';
const REVENUECAT_ANDROID_API_KEY = 'test_NVaCJScnTJldnjDHXLEQeiXAGXk';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Preload images at app startup
async function preloadAssets() {
  const imageAssets = Asset.loadAsync([
    require('../assets/images/home-bg.png'),
  ]);
  return imageAssets;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [revenueCatReady, setRevenueCatReady] = useState(false);

  // Initialize RevenueCat on app startup
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        const apiKey = Platform.OS === 'ios'
          ? REVENUECAT_IOS_API_KEY
          : REVENUECAT_ANDROID_API_KEY;

        await Purchases.configure({ apiKey });
        setRevenueCatReady(true);
        console.log('[RevenueCat] Initialized successfully');
      } catch (error) {
        console.error('[RevenueCat] Failed to initialize:', error);
        setRevenueCatReady(true); // Continue anyway
      }
    };

    initRevenueCat();
  }, []);

  // Preload assets on mount
  useEffect(() => {
    preloadAssets()
      .then(() => setAssetsLoaded(true))
      .catch((err) => {
        console.warn('Failed to preload assets:', err);
        setAssetsLoaded(true); // Continue anyway
      });
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Hide splash screen when both fonts and assets are loaded
  useEffect(() => {
    if (fontsLoaded && assetsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore error - splash screen may already be hidden during hot reload
      });
    }
  }, [fontsLoaded, assetsLoaded]);

  if (!fontsLoaded || !assetsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TabBarVisibilityProvider>
            <RootLayoutNav />
          </TabBarVisibilityProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Handle authentication routing
  useEffect(() => {
    // Debug: Visible logs for user
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log('[AuthDebug]', { isAuthenticated, inAuthGroup, path: segments.join('/') });

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Register push token and sync RevenueCat user when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading && user?.id) {
      // Register push token in background (don't block app startup)
      registerPushTokenWithBackend().catch((err) => {
        console.log('Failed to register push token:', err);
      });

      // Sync user with RevenueCat for subscription tracking
      Purchases.logIn(user.id)
        .then(({ customerInfo }) => {
          console.log('[RevenueCat] User logged in:', user.id);
        })
        .catch((err) => {
          console.log('[RevenueCat] Failed to log in user:', err);
        });
    }
  }, [isAuthenticated, isLoading, user?.id]);

  // Handle push notification taps
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[Notification] Tapped:', data);

      // Navigate to results page if caseId is present
      if (data?.caseId && isAuthenticated) {
        router.push(`/results/${data.caseId}`);
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="case/[id]"
          options={{
            headerShown: true,
            title: 'Vaka Detayı',
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerBackTitle: 'Geri',
          }}
        />
        <Stack.Screen name="medical-disclaimer" options={{ headerShown: true, title: 'Tıbbi Uyarı' }} />
        <Stack.Screen name="privacy-policy" options={{ headerShown: true, title: 'Gizlilik Politikası' }} />
        <Stack.Screen name="terms-of-service" options={{ headerShown: true, title: 'Kullanım Şartları' }} />
        <Stack.Screen name="contact-support" options={{ headerShown: true, title: 'Destek' }} />
        <Stack.Screen
          name="results/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
