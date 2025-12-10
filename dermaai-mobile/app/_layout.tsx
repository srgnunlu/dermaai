import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { Asset } from 'expo-asset';

import { useColorScheme } from '@/components/useColorScheme';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { TabBarVisibilityProvider } from '@/contexts/TabBarVisibilityContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

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
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, assetsLoaded]);

  if (!fontsLoaded || !assetsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TabBarVisibilityProvider>
          <RootLayoutNav />
        </TabBarVisibilityProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
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
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
