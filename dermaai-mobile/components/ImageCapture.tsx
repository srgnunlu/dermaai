/**
 * Image Capture Component
 * Premium design with gradient borders, glow effects, and animations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    Modal,
    Animated,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Camera, ImageIcon, X, Info, ZoomIn, Sparkles } from 'lucide-react-native';
import { Colors, Gradients, Glow } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { useColorScheme } from '@/components/useColorScheme';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { MAX_IMAGES, IMAGE_QUALITY } from '@/constants/Config';

// Max image dimension for AI analysis (maintains quality while reducing size)
const MAX_IMAGE_DIMENSION = 1920;

interface ImageCaptureProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
}

// Animated action button
const AnimatedButton = ({
    onPress,
    icon: Icon,
    label,
    isPrimary,
    colors,
    colorScheme,
    gradients,
}: {
    onPress: () => void;
    icon: any;
    label: string;
    isPrimary: boolean;
    colors: typeof Colors.light;
    colorScheme: 'light' | 'dark';
    gradients: typeof Gradients.light | typeof Gradients.dark;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isPrimary) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: Duration.pulse,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.3,
                        duration: Duration.pulse,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isPrimary]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                {isPrimary ? (
                    <View style={styles.buttonContainer}>
                        {/* Glow Effect */}
                        <Animated.View
                            style={[
                                styles.buttonGlow,
                                {
                                    backgroundColor: Glow[colorScheme].primary,
                                    opacity: glowAnim,
                                },
                            ]}
                        />
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.addButtonPrimary}
                        >
                            <Icon size={28} color="#FFFFFF" strokeWidth={1.5} />
                            <Text style={styles.addButtonTextPrimary}>{label}</Text>
                        </LinearGradient>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.addButton,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.card,
                            },
                        ]}
                    >
                        <Icon size={24} color={colors.textSecondary} strokeWidth={1.5} />
                        <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
                            {label}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// Image thumbnail with delete button
const ImageThumbnail = ({
    uri,
    index,
    onRemove,
    onPreview,
    colors,
    gradients,
}: {
    uri: string;
    index: number;
    onRemove: () => void;
    onPreview: () => void;
    colors: typeof Colors.light;
    gradients: typeof Gradients.light | typeof Gradients.dark;
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            delay: index * 100,
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
            style={[styles.imageContainer, { transform: [{ scale: scaleAnim }] }]}
        >
            {/* Gradient Border */}
            <LinearGradient
                colors={gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imageBorderGradient}
            >
                <TouchableOpacity onPress={onPreview} activeOpacity={0.8}>
                    <Image source={{ uri }} style={styles.image} />
                    <View style={[styles.zoomIcon, { backgroundColor: colors.overlay }]}>
                        <ZoomIn size={14} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            {/* Remove Button */}
            <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemove}
            >
                <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.removeButtonGradient}
                >
                    <X size={12} color="#FFFFFF" strokeWidth={3} />
                </LinearGradient>
            </TouchableOpacity>

            {/* Image Number Badge */}
            <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.numberBadgeText}>{index + 1}</Text>
            </View>
        </Animated.View>
    );
};

export function ImageCapture({
    images,
    onImagesChange,
    maxImages = MAX_IMAGES,
}: ImageCaptureProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Optimize image: resize to max 1920x1920 while maintaining aspect ratio
    const optimizeImage = async (uri: string): Promise<string> => {
        try {
            // Get image info to determine if resize is needed
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION } }],
                { compress: IMAGE_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipResult.uri;
        } catch (error) {
            console.warn('Image optimization failed, using original:', error);
            return uri; // Fallback to original if optimization fails
        }
    };

    // Request camera permissions
    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'İzin Gerekli',
                'Kamera kullanmak için izin vermeniz gerekmektedir.',
                [{ text: 'Tamam' }]
            );
            return false;
        }
        return true;
    };

    // Request gallery permissions
    const requestGalleryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'İzin Gerekli',
                'Galeri erişimi için izin vermeniz gerekmektedir.',
                [{ text: 'Tamam' }]
            );
            return false;
        }
        return true;
    };

    // Take photo with camera
    const handleTakePhoto = useCallback(async () => {
        if (images.length >= maxImages) {
            Alert.alert('Limit', `En fazla ${maxImages} görsel ekleyebilirsiniz.`);
            return;
        }

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: IMAGE_QUALITY,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const optimizedUri = await optimizeImage(result.assets[0].uri);
                onImagesChange([...images, optimizedUri]);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
        }
    }, [images, maxImages, onImagesChange]);

    // Pick from gallery
    const handlePickFromGallery = useCallback(async () => {
        if (images.length >= maxImages) {
            Alert.alert('Limit', `En fazla ${maxImages} görsel ekleyebilirsiniz.`);
            return;
        }

        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: IMAGE_QUALITY,
                allowsMultipleSelection: true,
                selectionLimit: maxImages - images.length,
            });

            if (!result.canceled && result.assets.length > 0) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Optimize all selected images
                const optimizedImages = await Promise.all(
                    result.assets.map(asset => optimizeImage(asset.uri))
                );
                onImagesChange([...images, ...optimizedImages].slice(0, maxImages));
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Hata', 'Görsel seçilirken bir hata oluştu.');
        }
    }, [images, maxImages, onImagesChange]);

    // Remove image
    const handleRemoveImage = useCallback(
        (index: number) => {
            const newImages = [...images];
            newImages.splice(index, 1);
            onImagesChange(newImages);
        },
        [images, onImagesChange]
    );

    // Preview image
    const handlePreviewImage = useCallback((uri: string) => {
        setPreviewImage(uri);
    }, []);

    const hasImages = images.length > 0;
    const canAddMore = images.length < maxImages;

    return (
        <Card elevated>
            <CardHeader
                title="Lezyon Görselleri"
                subtitle={`1-${maxImages} görsel yükleyin`}
                icon={<Camera size={18} color={colors.primary} />}
                action={
                    hasImages && (
                        <View style={[styles.countBadge, { backgroundColor: colors.successLight }]}>
                            <Text style={[styles.countText, { color: colors.success }]}>
                                {images.length}/{maxImages}
                            </Text>
                        </View>
                    )
                }
            />
            <CardContent>
                {/* Image Grid */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imageScrollContent}
                >
                    {/* Existing Images */}
                    {images.map((uri, index) => (
                        <ImageThumbnail
                            key={uri}
                            uri={uri}
                            index={index}
                            onRemove={() => handleRemoveImage(index)}
                            onPreview={() => handlePreviewImage(uri)}
                            colors={colors}
                            gradients={gradients}
                        />
                    ))}

                    {/* Add Image Buttons */}
                    {canAddMore && (
                        <View style={styles.addButtons}>
                            <AnimatedButton
                                onPress={handleTakePhoto}
                                icon={Camera}
                                label="Kamera"
                                isPrimary={!hasImages}
                                colors={colors}
                                colorScheme={colorScheme}
                                gradients={gradients}
                            />
                            <AnimatedButton
                                onPress={handlePickFromGallery}
                                icon={ImageIcon}
                                label="Galeri"
                                isPrimary={false}
                                colors={colors}
                                colorScheme={colorScheme}
                                gradients={gradients}
                            />
                        </View>
                    )}
                </ScrollView>

                {/* Guidelines - Premium Design */}
                <LinearGradient
                    colors={[colors.infoLight, `${colors.info}10`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.guidelines}
                >
                    <View style={styles.guidelinesIconContainer}>
                        <Sparkles size={18} color={colors.info} />
                    </View>
                    <View style={styles.guidelinesText}>
                        <Text style={[styles.guidelinesTitle, { color: colors.info }]}>
                            İyi bir görsel için:
                        </Text>
                        <Text style={[styles.guidelinesItem, { color: colors.textSecondary }]}>
                            • Yeterli ışık altında çekin{'\n'}
                            • Lezyonu net odaklayın{'\n'}
                            • Yaklaşık 10-15 cm mesafeden çekin
                        </Text>
                    </View>
                </LinearGradient>
            </CardContent>

            {/* Preview Modal */}
            <Modal
                visible={!!previewImage}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewImage(null)}
            >
                <TouchableOpacity
                    style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
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
                            style={[styles.closeButton, { backgroundColor: colors.card }]}
                            onPress={() => setPreviewImage(null)}
                        >
                            <X size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </Card>
    );
}

const styles = StyleSheet.create({
    imageScrollContent: {
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    imageContainer: {
        position: 'relative',
    },
    imageBorderGradient: {
        padding: 2,
        borderRadius: Spacing.radius.lg + 2,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: Spacing.radius.lg,
    },
    zoomIcon: {
        position: 'absolute',
        bottom: Spacing.xs,
        right: Spacing.xs,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        zIndex: 10,
    },
    removeButtonGradient: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    numberBadge: {
        position: 'absolute',
        top: -4,
        left: -4,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    numberBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    addButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    buttonContainer: {
        position: 'relative',
    },
    buttonGlow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: Spacing.radius.lg + 4,
    },
    addButtonPrimary: {
        width: 104,
        height: 104,
        borderRadius: Spacing.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        ...Shadows.md,
    },
    addButtonTextPrimary: {
        color: '#FFFFFF',
        ...Typography.styles.caption,
        fontWeight: '600',
    },
    addButton: {
        width: 100,
        height: 100,
        borderRadius: Spacing.radius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
    },
    addButtonText: {
        ...Typography.styles.caption,
        fontWeight: '500',
    },
    guidelines: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: Spacing.radius.lg,
        marginTop: Spacing.lg,
        gap: Spacing.sm,
    },
    guidelinesIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    guidelinesText: {
        flex: 1,
    },
    guidelinesTitle: {
        ...Typography.styles.label,
        marginBottom: Spacing.xs,
    },
    guidelinesItem: {
        ...Typography.styles.caption,
        lineHeight: 18,
    },
    countBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.radius.full,
    },
    countText: {
        ...Typography.styles.caption,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
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
        borderRadius: Spacing.radius.xl,
    },
    closeButton: {
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

