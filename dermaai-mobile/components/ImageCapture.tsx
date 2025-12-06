/**
 * ImageCapture component for capturing and selecting lesion images
 * Supports camera and gallery with up to 3 images
 */

import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { MAX_IMAGES, IMAGE_QUALITY, MAX_IMAGE_SIZE } from '@/constants/Config';
import { api } from '@/lib/api';

interface ImageCaptureProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
}

export function ImageCapture({ images, onImagesChange }: ImageCaptureProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [isUploading, setIsUploading] = useState(false);

    const requestCameraPermission = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Kamera İzni Gerekli',
                'Fotoğraf çekmek için kamera iznine ihtiyacımız var.',
                [{ text: 'Tamam' }]
            );
            return false;
        }
        return true;
    };

    const requestMediaPermission = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Galeri İzni Gerekli',
                'Galeriden resim seçmek için izne ihtiyacımız var.',
                [{ text: 'Tamam' }]
            );
            return false;
        }
        return true;
    };

    const uploadImage = async (uri: string): Promise<string | null> => {
        try {
            // For now, return the local URI
            // In production, you'd upload to backend and return the URL
            // TODO: Implement actual upload when backend is ready
            return uri;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    };

    const handleTakePhoto = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Limit', `Maksimum ${MAX_IMAGES} görsel yükleyebilirsiniz.`);
            return;
        }

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: IMAGE_QUALITY,
                allowsEditing: true,
                aspect: [1, 1],
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const uploadedUrl = await uploadImage(result.assets[0].uri);
                if (uploadedUrl) {
                    onImagesChange([...images, uploadedUrl]);
                }
                setIsUploading(false);
            }
        } catch (error) {
            Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
            setIsUploading(false);
        }
    };

    const handlePickFromGallery = async () => {
        const remaining = MAX_IMAGES - images.length;
        if (remaining <= 0) {
            Alert.alert('Limit', `Maksimum ${MAX_IMAGES} görsel yükleyebilirsiniz.`);
            return;
        }

        const hasPermission = await requestMediaPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: IMAGE_QUALITY,
                allowsMultipleSelection: true,
                selectionLimit: remaining,
            });

            if (!result.canceled && result.assets.length > 0) {
                setIsUploading(true);
                const newImages: string[] = [];

                for (const asset of result.assets) {
                    const uploadedUrl = await uploadImage(asset.uri);
                    if (uploadedUrl) {
                        newImages.push(uploadedUrl);
                    }
                }

                onImagesChange([...images, ...newImages].slice(0, MAX_IMAGES));
                setIsUploading(false);
            }
        } catch (error) {
            Alert.alert('Hata', 'Galeriden resim seçilirken bir hata oluştu.');
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                📷 Lezyon Görseli (1-3 görsel)
            </Text>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <View style={styles.imageGrid}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri }} style={styles.previewImage} />
                            <TouchableOpacity
                                style={[styles.removeButton, { backgroundColor: colors.destructive }]}
                                onPress={() => handleRemoveImage(index)}
                            >
                                <Text style={styles.removeButtonText}>✕</Text>
                            </TouchableOpacity>
                            <View style={[styles.imageCounter, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                                <Text style={styles.imageCounterText}>{index + 1}/{images.length}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Action Buttons */}
            {images.length < MAX_IMAGES && (
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleTakePhoto}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator color={colors.primaryForeground} size="small" />
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                                📸 Fotoğraf Çek
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}
                        onPress={handlePickFromGallery}
                        disabled={isUploading}
                    >
                        <Text style={[styles.buttonText, { color: colors.text }]}>
                            🖼️ Galeriden Seç
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Guidelines */}
            <View style={[styles.guidelines, { backgroundColor: colors.muted }]}>
                <Text style={[styles.guidelinesTitle, { color: colors.text }]}>Görsel Rehberi</Text>
                <Text style={[styles.guidelineText, { color: colors.textSecondary }]}>
                    • Aynı lezyonun 1-3 farklı açıdan fotoğrafını çekin
                </Text>
                <Text style={[styles.guidelineText, { color: colors.textSecondary }]}>
                    • Yüksek çözünürlük (min 1000x1000px) tercih edin
                </Text>
                <Text style={[styles.guidelineText, { color: colors.textSecondary }]}>
                    • İyi aydınlatma sağlayın
                </Text>
                <Text style={[styles.guidelineText, { color: colors.textSecondary }]}>
                    • Lezyona net odaklanın
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    imageWrapper: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    imageCounter: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    imageCounterText: {
        color: 'white',
        fontSize: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    guidelines: {
        padding: 12,
        borderRadius: 10,
    },
    guidelinesTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    guidelineText: {
        fontSize: 12,
        marginBottom: 4,
    },
});
