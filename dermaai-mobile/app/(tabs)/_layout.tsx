import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Text, Animated, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Stethoscope, History, User, Settings, Home, Camera } from 'lucide-react-native';

import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Custom tab bar icon component with circular background for active state
function TabBarIcon({
  Icon,
  color,
  focused
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string;
  focused: boolean;
}) {
  const iconSize = Platform.select({ android: 28, ios: 26 }) || 26;
  return (
    <View style={styles.iconWrapper}>
      {focused && <View style={styles.activeBackground} />}
      <Icon
        size={iconSize}
        color={focused ? '#0891B2' : '#6B7280'}
        strokeWidth={focused ? 2.2 : 1.8}
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { translateY, isVisible, isAnalyzing, showTabBarTemporarily } = useTabBarVisibility();
  const { language } = useLanguage();

  // Define explicit colors for better control
  const activeColor = '#0891B2'; // Teal/turkuaz
  const inactiveColor = '#6B7280'; // Darker gray for better visibility

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.select({ android: 28, ios: 32 }),
            left: 0,
            right: 0,
            marginHorizontal: Platform.select({ android: 20, ios: 24 }),
            height: Platform.select({ android: 72, ios: 68 }),
            borderRadius: Platform.select({ android: 36, ios: 34 }),
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowColor: '#0891B2',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            paddingBottom: 0,
            paddingTop: 0,
            transform: [{ translateY: translateY as any }],
          },
          tabBarBackground: () => (
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={80}
                tint={colorScheme === 'light' ? 'light' : 'dark'}
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 34,
                  overflow: 'hidden',
                  backgroundColor: colorScheme === 'light'
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(30, 41, 59, 0.5)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                }}
              />
            ) : (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 36,
                  overflow: 'hidden',
                  backgroundColor: colorScheme === 'light'
                    ? 'rgba(224, 247, 250, 0.85)'
                    : 'rgba(30, 41, 59, 0.85)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                }}
              />
            )
          ),
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: Platform.select({ android: 12, ios: 11 }),
            fontWeight: '600',
            marginBottom: Platform.select({ android: 10, ios: 8 }),
            marginTop: Platform.select({ android: -2, ios: -4 }),
          },
          tabBarItemStyle: {
            height: Platform.select({ android: 72, ios: 68 }),
            paddingTop: Platform.select({ android: 12, ios: 10 }),
            paddingBottom: Platform.select({ android: 8, ios: 6 }),
            justifyContent: 'center',
          },
          headerStyle: {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
            fontSize: 17,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: Translations.tabDiagnosis[language],
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon Icon={Stethoscope} color={color} focused={focused} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { color }]}>{Translations.tabDiagnosis[language]}</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: Translations.tabHistory[language],
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon Icon={History} color={color} focused={focused} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { color }]}>{Translations.tabHistory[language]}</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: Translations.tabProfile[language],
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon Icon={User} color={color} focused={focused} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { color }]}>{Translations.tabProfile[language]}</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: Translations.tabSettings[language],
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon Icon={Settings} color={color} focused={focused} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { color }]}>{Translations.tabSettings[language]}</Text>
            ),
          }}
        />
      </Tabs>

      {/* Pull-up indicator when tab bar is hidden - hidden during analysis */}
      {!isVisible && !isAnalyzing && (
        <TouchableOpacity
          style={styles.pullUpIndicator}
          onPress={showTabBarTemporarily}
          activeOpacity={0.7}
        >
          <View style={styles.pullUpLine} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const iconWrapperSize = Platform.select({ android: 42, ios: 38 }) || 38;

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: iconWrapperSize,
    height: iconWrapperSize,
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    width: iconWrapperSize,
    height: iconWrapperSize,
    borderRadius: iconWrapperSize / 2,
    backgroundColor: '#E0F7FA',
    opacity: 0.9,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 0,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: '#0891B2',
  },
  pullUpIndicator: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  pullUpLine: {
    width: 32,
    height: 4,
    backgroundColor: 'rgba(8, 145, 178, 0.6)',
    borderRadius: 2,
  },
});

