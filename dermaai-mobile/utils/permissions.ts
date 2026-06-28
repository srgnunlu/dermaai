import { Alert, Linking } from 'react-native';

type Lang = 'tr' | 'en';

/**
 * Shown when the OS camera/photo permission is denied. Critically offers an
 * "Open Settings" action — once a user denies a permission, iOS never shows the
 * system prompt again, so without this the feature becomes permanently unusable.
 */
export function showPermissionDeniedAlert(language: Lang, kind: 'camera' | 'photos') {
    const isTr = language === 'tr';
    const title = isTr ? 'İzin Gerekli' : 'Permission Required';
    const body = isTr
        ? kind === 'camera'
            ? 'Fotoğraf çekmek için kamera iznine ihtiyaç var. Lütfen Ayarlar\'dan izni etkinleştirin.'
            : 'Fotoğraf seçmek için galeri erişimine ihtiyaç var. Lütfen Ayarlar\'dan izni etkinleştirin.'
        : kind === 'camera'
            ? 'Camera access is required to take photos. Please enable it in Settings.'
            : 'Photo library access is required to select photos. Please enable it in Settings.';

    Alert.alert(title, body, [
        { text: isTr ? 'İptal' : 'Cancel', style: 'cancel' },
        { text: isTr ? 'Ayarlar' : 'Settings', onPress: () => Linking.openSettings() },
    ]);
}
