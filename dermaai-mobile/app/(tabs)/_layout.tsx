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
  return (
    <View style={styles.iconWrapper}>
      {focused && <View style={styles.activeBackground} />}
      <Icon
        size={26}
        color={focused ? '#0891B2' : '#6B7280'}
        strokeWidth={focused ? 2.2 : 1.8}
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { translateY, isVisible, showTabBarTemporarily } = useTabBarVisibility();
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
            bottom: 32,
            left: 70,
            right: 70,
            height: 68,
            borderRadius: 34,
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
            <BlurView
              intensity={Platform.OS === 'ios' ? 80 : 50}
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
          ),
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 8,
            marginTop: -4,
          },
          tabBarItemStyle: {
            height: 68,
            paddingTop: 10,
            paddingBottom: 6,
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
            headerTitle: Translations.caseHistory[language],
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
            headerTitle: Translations.myProfile[language],
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
            headerTitle: Translations.settingsTitle[language],
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon Icon={Settings} color={color} focused={focused} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { color }]}>{Translations.tabSettings[language]}</Text>
            ),
          }}
        />
      </Tabs>

      {/* Pull-up indicator when tab bar is hidden */}
      {!isVisible && (
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

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F7FA',
    opacity: 0.9,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 0,
  },
  tabLabelActive: {
    fontWeight: '700',
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

