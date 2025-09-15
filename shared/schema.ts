import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(), // user, admin
  medicalLicenseNumber: varchar("medical_license_number"),
  specialization: varchar("specialization"),
  hospital: varchar("hospital"),
  yearsOfExperience: integer("years_of_experience"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull().unique(),
  age: integer("age"),
  gender: text("gender"),
  skinType: text("skin_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: text("case_id").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  patientId: varchar("patient_id").references(() => patients.id),
  imageUrl: text("image_url").notNull(),
  lesionLocation: text("lesion_location"),
  symptoms: jsonb("symptoms").$type<string[]>(),
  additionalSymptoms: text("additional_symptoms"),
  symptomDuration: text("symptom_duration"),
  medicalHistory: jsonb("medical_history").$type<string[]>(),
  geminiAnalysis: jsonb("gemini_analysis").$type<{
    diagnoses: Array<{
      name: string;
      confidence: number;
      description: string;
      keyFeatures: string[];
      recommendations: string[];
    }>;
    analysisTime: number;
  }>(),
  openaiAnalysis: jsonb("openai_analysis").$type<{
    diagnoses: Array<{
      name: string;
      confidence: number;
      description: string;
      keyFeatures: string[];
      recommendations: string[];
    }>;
    analysisTime: number;
  }>(),
  finalDiagnoses: jsonb("final_diagnoses").$type<Array<{
    rank: number;
    name: string;
    confidence: number;
    description: string;
    keyFeatures: string[];
    recommendations: string[];
    isUrgent: boolean;
  }>>(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

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

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
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

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  phoneNumber: true,
  medicalLicenseNumber: true,
  specialization: true,
  hospital: true,
  yearsOfExperience: true,
}).partial();

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// User settings table
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  useGemini: jsonb("use_gemini").default(true).$type<boolean>(),
  useOpenAI: jsonb("use_openai").default(true).$type<boolean>(),
  confidenceThreshold: integer("confidence_threshold").default(40),
  autoSaveCases: jsonb("auto_save_cases").default(true).$type<boolean>(),
  anonymizeData: jsonb("anonymize_data").default(false).$type<boolean>(),
  dataRetention: text("data_retention").default("90"),
  theme: text("theme").default("system"),
  compactMode: jsonb("compact_mode").default(false).$type<boolean>(),
  analysisNotifications: jsonb("analysis_notifications").default(true).$type<boolean>(),
  urgentAlerts: jsonb("urgent_alerts").default(true).$type<boolean>(),
  soundNotifications: jsonb("sound_notifications").default(false).$type<boolean>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
