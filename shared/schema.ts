import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  patientId: varchar("patient_id").references(() => patients.id),
  imageUrl: text("image_url").notNull(),
  lesionLocation: text("lesion_location"),
  symptoms: text("symptoms"),
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
  createdAt: true,
  status: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
