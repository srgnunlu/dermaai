/**
 * Image Upload Step - Premium Clean Design
 * Minimalistic image capture matching the mockup aesthetic
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Animated,
    Easing,
    ScrollView,
    Modal,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
    Camera,
    Image as ImageIcon,
    X,
    ChevronLeft,
    ArrowRight,
    Plus,
    ZoomIn,
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_IMAGES, IMAGE_QUALITY } from '@/constants/Config';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageUploadStepProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    onNext: () => void;
    onBack: () => void;
    canProceed: boolean;
}

// Image thumbnail
const ImageThumbnail = ({
    uri,
    index,
    onRemove,
    onPreview,
    colors,
}: {
    uri: string;
    index: number;
    onRemove: () => void;
    onPreview: () => void;
    colors: typeof Colors.light;
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            delay: index * 80,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRemove = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.timing(scaleAnim, {
            toValue: 0,
            duration: Duration.fast,
            useNativeDriver: true,
        }).start(() => onRemove());
    };

    return (
        <Animated.View
            style={[styles.thumbnailContainer, { transform: [{ scale: scaleAnim }] }]}
        >
            <TouchableOpacity onPress={onPreview} activeOpacity={0.9}>
                <Image source={{ uri }} style={[styles.thumbnail, { borderColor: colors.border }]} />
                <View style={[styles.zoomBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <ZoomIn size={12} color="#FFFFFF" />
                </View>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: colors.destructive }]}
                onPress={handleRemove}
            >
                <X size={12} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
        </Animated.View>
    );
};

// Add image placeholder - Glassmorphism style
const AddImagePlaceholder = ({
    onPress,
    colors,
}: {
    onPress: () => void;
    colors: typeof Colors.light;
}) => (
    <View style={styles.addPlaceholderWrapper}>
        <BlurView intensity={40} tint="light" style={styles.addPlaceholderBlur}>
            <TouchableOpacity
                onPress={onPress}
                style={styles.addPlaceholderContent}
                activeOpacity={0.7}
            >
                <Plus size={24} color={colors.textSecondary} />
            </TouchableOpacity>
        </BlurView>
    </View>
);

export function ImageUploadStep({
    images,
    onImagesChange,
    onNext,
    onBack,
    canProceed,
}: ImageUploadStepProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const { language } = useLanguage();

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: Duration.normal,
            useNativeDriver: true,
        }).start();
    }, []);

    // Permission requests
    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                Translations.cameraPermissionRequired[language],
                language === 'tr' ? 'Kamera kullanmak için izin vermeniz gerekmektedir.' : 'Permission is required to use the camera.'
            );
            return false;
        }
        return true;
    };

    const requestGalleryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekmektedir.');
            return false;
        }
        return true;
    };

    // Take photo
    const handleTakePhoto = useCallback(async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Limit', `En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz.`);
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: IMAGE_QUALITY,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onImagesChange([...images, result.assets[0].uri]);
            }
        } catch (error) {
            Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
        }
    }, [images, onImagesChange]);

    // Pick from gallery
    const handlePickFromGallery = useCallback(async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Limit', `En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz.`);
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: IMAGE_QUALITY,
                allowsMultipleSelection: true,
                selectionLimit: MAX_IMAGES - images.length,
            });

            if (!result.canceled && result.assets.length > 0) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const newImages = result.assets.map(asset => asset.uri);
                onImagesChange([...images, ...newImages].slice(0, MAX_IMAGES));
            }
        } catch (error) {
            Alert.alert('Hata', 'Görsel seçilirken bir hata oluştu.');
        }
    }, [images, onImagesChange]);

    const handleRemoveImage = useCallback((index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onImagesChange(newImages);
    }, [images, onImagesChange]);

    const handlePressIn = () => {
        Animated.spring(buttonScaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handleNext = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onNext();
    };

    const hasImages = images.length > 0;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.appName, { color: colors.textSecondary }]}>
                    DermaAssist<Text style={{ color: colors.primary }}>AI</Text>
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>
                    {language === 'tr' ? 'Lezyon Fotoğrafı' : 'Lesion Photo'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {language === 'tr'
                        ? 'Net bir görsel çekin veya galeriden seçin'
                        : 'Take a clear photo or select from gallery'}
                </Text>

                {/* Capture Buttons */}
                <View style={styles.captureSection}>
                    {/* Camera Button - Primary */}
                    <TouchableOpacity
                        onPress={handleTakePhoto}
                        activeOpacity={0.9}
                        disabled={images.length >= MAX_IMAGES}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cameraButton}
                        >
                            <View style={styles.cameraIconBg}>
                                <Camera size={28} color="#FFFFFF" />
                            </View>
                            <Text style={styles.cameraButtonText}>{Translations.takePhoto[language]}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Gallery Button - Glassmorphism */}
                    <BlurView intensity={60} tint="light" style={styles.galleryButtonBlur}>
                        <TouchableOpacity
                            onPress={handlePickFromGallery}
                            activeOpacity={0.8}
                            disabled={images.length >= MAX_IMAGES}
                            style={styles.galleryButton}
                        >
                            <ImageIcon size={22} color="#334155" />
                            <Text style={styles.galleryButtonText}>
                                {Translations.chooseFromGallery[language]}
                            </Text>
                        </TouchableOpacity>
                    </BlurView>
                </View>

                {/* Images Grid */}
                {hasImages && (
                    <View style={styles.imagesSection}>
                        <View style={styles.imagesSectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {language === 'tr' ? 'Yüklenen Görseller' : 'Uploaded Images'}
                            </Text>
                            <Text style={[styles.imageCount, { color: colors.primary }]}>
                                {images.length}/{MAX_IMAGES}
                            </Text>
                        </View>
                        <View style={styles.imagesGrid}>
                            {images.map((uri, index) => (
                                <ImageThumbnail
                                    key={uri}
                                    uri={uri}
                                    index={index}
                                    onRemove={() => handleRemoveImage(index)}
                                    onPreview={() => setPreviewImage(uri)}
                                    colors={colors}
                                />
                            ))}
                            {images.length < MAX_IMAGES && (
                                <AddImagePlaceholder
                                    onPress={handleTakePhoto}
                                    colors={colors}
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* Tips Card - Glassmorphism */}
                <View style={styles.tipsCardWrapper}>
                    <BlurView intensity={70} tint="light" style={styles.tipsCardBlur}>
                        <View style={styles.tipsCard}>
                            <View style={styles.tipIconBg}>
                                <Camera size={18} color="#0891B2" />
                            </View>
                            <View style={styles.tipsContent}>
                                <Text style={styles.tipsTitle}>
                                    {language === 'tr' ? 'İpucu' : 'Tip'}
                                </Text>
                                <Text style={styles.tipsText}>
                                    {language === 'tr'
                                        ? 'İyi ışıkta, 10-15 cm mesafeden net bir fotoğraf çekin.'
                                        : 'Take a clear photo in good lighting from 10-15 cm distance.'}
                                </Text>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Animated.View style={[styles.footerButton, { transform: [{ scale: buttonScaleAnim }] }]}>
                    <TouchableOpacity
                        onPress={handleNext}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={!canProceed}
                        activeOpacity={1}
                    >
                        <LinearGradient
                            colors={canProceed ? gradients.primary : ['rgba(200,200,200,0.5)', 'rgba(200,200,200,0.5)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueButton}
                        >
                            <Text style={[styles.continueButtonText, { opacity: canProceed ? 1 : 0.5 }]}>
                                {Translations.next[language]}
                            </Text>
                            <ArrowRight size={20} color="#FFFFFF" style={{ opacity: canProceed ? 1 : 0.5 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Preview Modal */}
            <Modal
                visible={!!previewImage}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewImage(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPreviewImage(null)}
                >
                    <View style={styles.modalContent}>
                        {previewImage && (
                            <Image
                                source={{ uri: previewImage }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                        )}
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: colors.card }]}
                            onPress={() => setPreviewImage(null)}
                        >
                            <X size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
    },
    appName: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.styles.body,
        marginBottom: Spacing.xl,
    },
    captureSection: {
        gap: Spacing.md,
        marginBottom: Spacing['2xl'],
    },
    cameraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 16,
        gap: Spacing.md,
        ...Shadows.md,
    },
    cameraIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    galleryButtonBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    galleryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: Spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    galleryButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#334155',
    },
    imagesSection: {
        marginBottom: Spacing.xl,
    },
    imagesSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    imageCount: {
        fontSize: 14,
        fontWeight: '600',
    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    thumbnailContainer: {
        position: 'relative',
    },
    thumbnail: {
        width: (SCREEN_WIDTH - 80) / 3,
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
    },
    zoomBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPlaceholderWrapper: {
        width: (SCREEN_WIDTH - 80) / 3,
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    addPlaceholderBlur: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(8, 145, 178, 0.3)',
    },
    addPlaceholderContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    tipsCardWrapper: {
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderRadius: 16,
        overflow: 'hidden',
    },
    tipsCardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    tipsCard: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    tipIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
    },
    tipsContent: {
        flex: 1,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
        color: '#0891B2',
    },
    tipsText: {
        ...Typography.styles.caption,
        lineHeight: 18,
        color: '#334155',
    },
    footer: {
        padding: Spacing.xl,
    },
    footerButton: {
        width: '100%',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: Spacing.sm,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        width: '100%',
        aspectRatio: 1,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    closeBtn: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
});
