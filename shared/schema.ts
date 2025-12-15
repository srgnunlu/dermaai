import { sql } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable(
  'users',
  {
    id: varchar('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar('email').unique(),
    firstName: varchar('first_name'),
    lastName: varchar('last_name'),
    profileImageUrl: varchar('profile_image_url'),
    role: varchar('role').default('user').notNull(), // user, admin
    medicalLicenseNumber: varchar('medical_license_number'),
    specialization: varchar('specialization'),
    hospital: varchar('hospital'),
    yearsOfExperience: integer('years_of_experience'),
    phoneNumber: varchar('phone_number'),
    isHealthProfessional: jsonb('is_health_professional').default(false).$type<boolean>(),
    isProfileComplete: jsonb('is_profile_complete').default(false).$type<boolean>(),
    // Subscription fields
    subscriptionTier: varchar('subscription_tier').default('free').notNull(), // 'free' | 'basic' | 'pro'
    subscriptionExpiresAt: timestamp('subscription_expires_at'),
    monthlyAnalysisCount: integer('monthly_analysis_count').default(0).notNull(),
    monthlyAnalysisResetAt: timestamp('monthly_analysis_reset_at'),
    revenueCatId: varchar('revenuecat_id'), // RevenueCat customer ID
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_users_role').on(table.role),
    index('idx_users_created_at').on(table.createdAt),
    index('idx_users_subscription').on(table.subscriptionTier),
  ]
);

export const patients = pgTable('patients', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  patientId: text('patient_id').notNull().unique(),
  age: integer('age'),
  gender: text('gender'),
  skinType: text('skin_type'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cases = pgTable(
  'cases',
  {
    id: varchar('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    caseId: text('case_id').notNull().unique(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id),
    patientId: varchar('patient_id').references(() => patients.id),
    imageUrl: text('image_url'), // Kept for backward compatibility
    imageUrls: jsonb('image_urls').$type<string[]>(), // New: support 1-3 images
    lesionLocation: text('lesion_location'),
    symptoms: jsonb('symptoms').$type<string[]>(),
    additionalSymptoms: text('additional_symptoms'),
    symptomDuration: text('symptom_duration'),
    medicalHistory: jsonb('medical_history').$type<string[]>(),
    geminiAnalysis: jsonb('gemini_analysis').$type<{
      diagnoses: Array<{
        name: string;
        confidence: number;
        description: string;
        keyFeatures: string[];
        recommendations: string[];
      }>;
      analysisTime: number;
    }>(),
    openaiAnalysis: jsonb('openai_analysis').$type<{
      diagnoses: Array<{
        name: string;
        confidence: number;
        description: string;
        keyFeatures: string[];
        recommendations: string[];
      }>;
      analysisTime: number;
    }>(),
    finalDiagnoses: jsonb('final_diagnoses').$type<
      Array<{
        rank: number;
        name: string;
        confidence: number;
        description: string;
        keyFeatures: string[];
        recommendations: string[];
        isUrgent: boolean;
      }>
    >(),
    dermatologistDiagnosis: text('dermatologist_diagnosis'),
    dermatologistNotes: text('dermatologist_notes'),
    dermatologistDiagnosedBy: varchar('dermatologist_diagnosed_by').references(() => users.id),
    dermatologistDiagnosedAt: timestamp('dermatologist_diagnosed_at'),
    status: text('status').default('pending'),
    selectedAnalysisProvider: text('selected_analysis_provider').default('gemini'), // 'gemini' | 'openai'
    isHidden: jsonb('is_hidden').default(false).$type<boolean>(), // Hidden from history when anonymization is enabled
    // Pro user features: favorites and notes
    isFavorite: jsonb('is_favorite').default(false).$type<boolean>(), // Favorited by user
    userNotes: text('user_notes'), // User's personal notes about the case
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_cases_user_id').on(table.userId),
    index('idx_cases_status').on(table.status),
    index('idx_cases_created_at').on(table.createdAt),
    index('idx_cases_user_created').on(table.userId, table.createdAt),
  ]
);

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  caseId: true,
  userId: true, // Set by server based on authenticated user
  createdAt: true,
  status: true,
});

export const updateDermatologistDiagnosisSchema = z.object({
  dermatologistDiagnosis: z.string().min(1, 'Diagnosis is required'),
  dermatologistNotes: z.string().optional(),
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
export type UpdateDermatologistDiagnosis = z.infer<typeof updateDermatologistDiagnosisSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const updateUserProfileSchema = createInsertSchema(users)
  .pick({
    firstName: true,
    lastName: true,
    phoneNumber: true,
    medicalLicenseNumber: true,
    specialization: true,
    hospital: true,
    yearsOfExperience: true,
    profileImageUrl: true,
    isHealthProfessional: true,
    isProfileComplete: true,
  })
  .partial();

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// User settings table
export const userSettings = pgTable('user_settings', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  useGemini: jsonb('use_gemini').default(true).$type<boolean>(),
  useOpenAI: jsonb('use_openai').default(true).$type<boolean>(),
  confidenceThreshold: integer('confidence_threshold').default(40),
  autoSaveCases: jsonb('auto_save_cases').default(true).$type<boolean>(),
  anonymizeData: jsonb('anonymize_data').default(false).$type<boolean>(),
  dataRetention: text('data_retention').default('90'),
  theme: text('theme').default('system'),
  compactMode: jsonb('compact_mode').default(false).$type<boolean>(),
  analysisNotifications: jsonb('analysis_notifications').default(true).$type<boolean>(),
  urgentAlerts: jsonb('urgent_alerts').default(true).$type<boolean>(),
  soundNotifications: jsonb('sound_notifications').default(false).$type<boolean>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSettingsSchema = z.object({
  useGemini: z.boolean().optional(),
  useOpenAI: z.boolean().optional(),
  confidenceThreshold: z.number().optional(),
  autoSaveCases: z.boolean().optional(),
  anonymizeData: z.boolean().optional(),
  dataRetention: z.string().optional(),
  theme: z.string().optional(),
  compactMode: z.boolean().optional(),
  analysisNotifications: z.boolean().optional(),
  urgentAlerts: z.boolean().optional(),
  soundNotifications: z.boolean().optional(),
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// System-wide settings controlled by admin
export const systemSettings = pgTable('system_settings', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  enableGemini: jsonb('enable_gemini').default(true).$type<boolean>(),
  enableOpenAI: jsonb('enable_openai').default(true).$type<boolean>(),
  openaiModel: text('openai_model').default('gpt-4o-mini'),
  openaiAllowFallback: jsonb('openai_allow_fallback').default(true).$type<boolean>(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const updateSystemSettingsSchema = z.object({
  enableGemini: z.boolean().optional(),
  enableOpenAI: z.boolean().optional(),
  openaiModel: z.enum(['gpt-5.1']).optional(),
  openaiAllowFallback: z.boolean().optional(),
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type UpdateSystemSettings = z.infer<typeof updateSystemSettingsSchema>;

// Push notification tokens for mobile devices
export const pushTokens = pgTable(
  'push_tokens',
  {
    id: varchar('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: text('platform'), // 'ios' | 'android'
    deviceId: text('device_id'), // Optional unique device identifier
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_push_tokens_user_id').on(table.userId),
    index('idx_push_tokens_token').on(table.token),
  ]
);

// ============================================
// PRO FEATURE: Lesion Tracking System
// ============================================

// Lesion tracking - tracks a specific lesion over time (Pro feature)
export const lesionTrackings = pgTable(
  'lesion_trackings',
  {
    id: varchar('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // User-given name: "Sol koldaki ben", "Sırt lezyonu"
    bodyLocation: text('body_location'), // Anatomical location
    description: text('description'), // Optional description
    initialCaseId: varchar('initial_case_id')
      .references(() => cases.id, { onDelete: 'set null' }), // First analysis case
    status: text('status').default('monitoring'), // 'monitoring' | 'resolved' | 'urgent'
    lastComparisonAt: timestamp('last_comparison_at'),
    snapshotCount: integer('snapshot_count').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_lesion_trackings_user_id').on(table.userId),
    index('idx_lesion_trackings_status').on(table.status),
    index('idx_lesion_trackings_created_at').on(table.createdAt),
  ]
);

// Lesion snapshots - individual recordings for a tracked lesion
export const lesionSnapshots = pgTable(
  'lesion_snapshots',
  {
    id: varchar('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    lesionTrackingId: varchar('lesion_tracking_id')
      .notNull()
      .references(() => lesionTrackings.id, { onDelete: 'cascade' }),
    caseId: varchar('case_id')
      .references(() => cases.id, { onDelete: 'set null' }), // Associated case with full analysis
    imageUrls: jsonb('image_urls').$type<string[]>(), // Images for this snapshot
    notes: text('notes'), // User notes for this snapshot
    snapshotOrder: integer('snapshot_order').default(1), // Order in the tracking timeline
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_lesion_snapshots_tracking_id').on(table.lesionTrackingId),
    index('idx_lesion_snapshots_created_at').on(table.createdAt),
  ]
);

// Lesion comparisons - AI comparison analysis between two snapshots
export const lesionComparisons = pgTable(
  'lesion_comparisons',
  {
    id: varchar('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    lesionTrackingId: varchar('lesion_tracking_id')
      .notNull()
      .references(() => lesionTrackings.id, { onDelete: 'cascade' }),
    previousSnapshotId: varchar('previous_snapshot_id')
      .notNull()
      .references(() => lesionSnapshots.id, { onDelete: 'cascade' }),
    currentSnapshotId: varchar('current_snapshot_id')
      .notNull()
      .references(() => lesionSnapshots.id, { onDelete: 'cascade' }),
    comparisonAnalysis: jsonb('comparison_analysis').$type<{
      changeDetected: boolean;
      changeSummary: string;
      sizeChange: string | null;
      colorChange: string | null;
      borderChange: string | null;
      textureChange: string | null;
      overallProgression: 'stable' | 'improved' | 'worsened' | 'significant_change';
      riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
      recommendations: string[];
      detailedAnalysis: string;
      timeElapsed: string;
      analysisTime: number;
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_lesion_comparisons_tracking_id').on(table.lesionTrackingId),
    index('idx_lesion_comparisons_created_at').on(table.createdAt),
  ]
);

// Schema types for lesion tracking
export const insertLesionTrackingSchema = createInsertSchema(lesionTrackings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  snapshotCount: true,
  lastComparisonAt: true,
});

export const insertLesionSnapshotSchema = createInsertSchema(lesionSnapshots).omit({
  id: true,
  createdAt: true,
  snapshotOrder: true,
});

export type InsertLesionTracking = z.infer<typeof insertLesionTrackingSchema>;
export type LesionTracking = typeof lesionTrackings.$inferSelect;
export type InsertLesionSnapshot = z.infer<typeof insertLesionSnapshotSchema>;
export type LesionSnapshot = typeof lesionSnapshots.$inferSelect;
export type LesionComparison = typeof lesionComparisons.$inferSelect;

export const insertPushTokenSchema = createInsertSchema(pushTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
export type PushToken = typeof pushTokens.$inferSelect;
