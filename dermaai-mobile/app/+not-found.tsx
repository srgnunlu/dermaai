import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFoundScreen() {
  const { language } = useLanguage();
  const isTr = language === 'tr';

  return (
    <>
      <Stack.Screen options={{ title: isTr ? 'Bulunamadı' : 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>
          {isTr ? 'Bu sayfa bulunamadı.' : "This screen doesn't exist."}
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>
            {isTr ? 'Ana sayfaya dön' : 'Go to home screen'}
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#0891B2',
  },
});
