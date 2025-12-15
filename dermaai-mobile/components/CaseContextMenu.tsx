/**
 * CaseContextMenu Component
 * Context menu for case long press actions (Pro feature)
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Star, StarOff, FileText, X } from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import type { Case } from '@/types/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CaseContextMenuProps {
    visible: boolean;
    onClose: () => void;
    onToggleFavorite: () => void;
    onAddNote: () => void;
    caseData: Case | null;
    language: 'tr' | 'en';
    isPro: boolean;
}

export function CaseContextMenu({
    visible,
    onClose,
    onToggleFavorite,
    onAddNote,
    caseData,
    language,
    isPro,
}: CaseContextMenuProps) {
    if (!caseData) return null;

    const isFavorite = caseData.isFavorite === true;
    const hasNotes = !!caseData.userNotes;

    const handleToggleFavorite = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggleFavorite();
    };

    const handleAddNote = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onAddNote();
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    // Show upgrade prompt for non-Pro users
    const renderProBadge = () => {
        if (isPro) return null;
        return (
            <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <View style={styles.menuContainer}>
                    <BlurView intensity={90} tint="light" style={styles.menuBlur}>
                        <View style={styles.menuContent}>
                            {/* Close Button */}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleClose}
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>

                            {/* Menu Items */}
                            <TouchableOpacity
                                style={[styles.menuItem, !isPro && styles.menuItemDisabled]}
                                onPress={isPro ? handleToggleFavorite : undefined}
                                activeOpacity={isPro ? 0.7 : 1}
                            >
                                <View style={[styles.iconContainer, isFavorite && styles.iconContainerActive]}>
                                    {isFavorite ? (
                                        <StarOff size={22} color="#F59E0B" />
                                    ) : (
                                        <Star size={22} color="#F59E0B" />
                                    )}
                                </View>
                                <View style={styles.menuItemTextContainer}>
                                    <Text style={[styles.menuItemText, !isPro && styles.menuItemTextDisabled]}>
                                        {isFavorite
                                            ? Translations.removeFromFavorites[language]
                                            : Translations.addToFavorites[language]}
                                    </Text>
                                </View>
                                {renderProBadge()}
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity
                                style={[styles.menuItem, !isPro && styles.menuItemDisabled]}
                                onPress={isPro ? handleAddNote : undefined}
                                activeOpacity={isPro ? 0.7 : 1}
                            >
                                <View style={[styles.iconContainer, hasNotes && styles.iconContainerActive]}>
                                    <FileText size={22} color="#0891B2" />
                                </View>
                                <View style={styles.menuItemTextContainer}>
                                    <Text style={[styles.menuItemText, !isPro && styles.menuItemTextDisabled]}>
                                        {hasNotes
                                            ? Translations.editNote[language]
                                            : Translations.addNote[language]}
                                    </Text>
                                </View>
                                {renderProBadge()}
                            </TouchableOpacity>

                            {/* Upgrade Prompt for non-Pro */}
                            {!isPro && (
                                <View style={styles.upgradePrompt}>
                                    <Text style={styles.upgradeText}>
                                        {Translations.upgradeForFeature[language]}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </BlurView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        width: SCREEN_WIDTH - Spacing.xl * 2,
        maxWidth: 320,
        borderRadius: 20,
        overflow: 'hidden',
    },
    menuBlur: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    menuContent: {
        padding: Spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        padding: 4,
        zIndex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    menuItemDisabled: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    iconContainerActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    menuItemTextContainer: {
        flex: 1,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    menuItemTextDisabled: {
        color: '#94A3B8',
    },
    menuDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        marginVertical: Spacing.xs,
    },
    proBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    proBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    upgradePrompt: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    upgradeText: {
        fontSize: 13,
        color: '#92400E',
        textAlign: 'center',
        fontWeight: '500',
    },
});
