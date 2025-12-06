import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAnalyzeCase } from '@/hooks/useCases';
import { ImageCapture } from '@/components/ImageCapture';
import { PatientForm } from '@/components/PatientForm';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { DiagnosisResults } from '@/components/DiagnosisResults';
import type { PatientData, Case } from '@/types/schema';

export default function DiagnosisScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [images, setImages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<Case | null>(null);
  const { analyze, isAnalyzing, error, reset } = useAnalyzeCase();

  const handleSubmit = async (patientData: PatientData) => {
    if (images.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir lezyon görseli yükleyiniz.');
      return;
    }

    try {
      const result = await analyze({ patientData, imageUrls: images });
      setAnalysisResult(result);
    } catch (err) {
      Alert.alert(
        'Analiz Başarısız',
        err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyiniz.'
      );
    }
  };

  const handleNewAnalysis = () => {
    setImages([]);
    setAnalysisResult(null);
    reset();
  };

  // Show analysis progress
  if (isAnalyzing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AnalysisProgress isActive={true} />
      </View>
    );
  }

  // Show results
  if (analysisResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DiagnosisResults
          caseData={analysisResult}
          onNewAnalysis={handleNewAnalysis}
        />
      </View>
    );
  }

  // Show form
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Dermatolojik Tanı Desteği
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          AI destekli cilt lezyonu analizi (1-3 görsel desteklenir)
        </Text>
      </View>

      {/* Image Capture */}
      <ImageCapture
        images={images}
        onImagesChange={setImages}
      />

      {/* Patient Form */}
      <PatientForm
        onSubmit={handleSubmit}
        isLoading={isAnalyzing}
        hasImages={images.length > 0}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
});
