import { 
  type Patient, 
  type InsertPatient, 
  type Case, 
  type InsertCase, 
  type User, 
  type UpsertUser,
  type UserSettings,
  type UpdateUserSettings,
  type UpdateUserProfile,
  patients,
  cases,
  users,
  userSettings
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getUserProfile(userId: string): Promise<User | undefined>;
  updateUserProfile(userId: string, profileData: UpdateUserProfile): Promise<User>;
  getUserStatistics(userId: string): Promise<{ totalCases: number; thisMonthCases: number; accuracyRate: number }>;
  
  // Patient operations
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  
  // Case operations
  createCase(caseData: InsertCase, userId: string): Promise<Case>;
  getCase(id: string, userId: string): Promise<Case | undefined>;
  getCaseForAdmin(id: string): Promise<Case | undefined>;
  getCaseByCaseId(caseId: string, userId: string): Promise<Case | undefined>;
  getCaseByCaseIdForAdmin(caseId: string): Promise<Case | undefined>;
  getCases(userId: string): Promise<Case[]>;
  updateCase(id: string, userId: string, updates: Partial<Case>): Promise<Case>;
  deleteCase(id: string): Promise<boolean>;
  
  // Settings operations
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;
  
  // Admin operations
  getAllCasesForAdmin(): Promise<(Case & { user?: User })[]>;
  getSystemStatistics(): Promise<{
    totalCases: number;
    pendingCases: number;
    completedCases: number;
    totalUsers: number;
    activeUsers: number;
    avgDiagnosisTime: number;
  }>;
  getAllUsers(): Promise<User[]>;
  promoteUserToAdmin(userId: string): Promise<User>;
  demoteUserFromAdmin(userId: string): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {

  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Extract id from userData to avoid updating it during conflict resolution
    const { id, ...updateData } = userData;
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...updateData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async updateUserProfile(userId: string, profileData: UpdateUserProfile): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getUserStatistics(userId: string): Promise<{ totalCases: number; thisMonthCases: number; accuracyRate: number }> {
    const userCases = await db
      .select()
      .from(cases)
      .where(eq(cases.userId, userId));
    
    const totalCases = userCases.length;
    
    // Calculate this month's cases
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthCases = userCases.filter(c => {
      if (!c.createdAt) return false;
      const caseDate = new Date(c.createdAt);
      return caseDate.getMonth() === currentMonth && caseDate.getFullYear() === currentYear;
    }).length;
    
    // Calculate accuracy rate (simulated for now - would need feedback system)
    // For now, we'll calculate based on confidence scores
    let totalConfidence = 0;
    let validCases = 0;
    
    userCases.forEach(c => {
      if (c.finalDiagnoses && c.finalDiagnoses.length > 0) {
        totalConfidence += c.finalDiagnoses[0].confidence;
        validCases++;
      }
    });
    
    const accuracyRate = validCases > 0 ? Math.round(totalConfidence / validCases) : 0;
    
    return {
      totalCases,
      thisMonthCases,
      accuracyRate
    };
  }

  // Patient operations
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    // Add retry logic for patient ID uniqueness constraint violations
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // If no patientId provided, generate a unique one
        const patientData = {
          ...insertPatient,
          patientId: insertPatient.patientId || `PAT-${Date.now()}-${nanoid(8)}`
        };
        
        const [patient] = await db
          .insert(patients)
          .values(patientData)
          .returning();
        return patient;
      } catch (error: any) {
        attempts++;
        if (error.code === '23505' && error.constraint === 'patients_patient_id_unique') {
          if (attempts < maxAttempts) {
            console.log(`Patient ID collision detected for ID: ${insertPatient.patientId}, retrying (attempt ${attempts + 1}/${maxAttempts})`);
            // Generate a new unique patient ID by appending timestamp and random string
            insertPatient.patientId = `${insertPatient.patientId || 'PAT'}-${Date.now()}-${nanoid(6)}`;
            continue;
          } else {
            throw new Error(`Patient ID '${insertPatient.patientId}' already exists. Please use a different patient ID.`);
          }
        }
        throw error;
      }
    }
    
    throw new Error('Failed to create patient record after maximum attempts');
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return patient;
  }

  // Case operations  
  async createCase(insertCase: InsertCase, userId: string): Promise<Case> {
    // Generate truly unique case ID with timestamp and random component
    const timestamp = Date.now();
    const randomId = nanoid(8);
    const year = new Date().getFullYear();
    const caseId = `DR-${year}-${timestamp}-${randomId}`;
    
    // Add retry logic for unique constraint violations
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const [caseRecord] = await db
          .insert(cases)
          .values({
            caseId: attempts === 0 ? caseId : `DR-${year}-${Date.now()}-${nanoid(10)}`,
            userId: userId,
            patientId: insertCase.patientId || null,
            imageUrl: insertCase.imageUrl,
            lesionLocation: insertCase.lesionLocation || null,
            symptoms: insertCase.symptoms || null,
            medicalHistory: insertCase.medicalHistory || null,
            geminiAnalysis: insertCase.geminiAnalysis || null,
            openaiAnalysis: insertCase.openaiAnalysis || null,
            finalDiagnoses: insertCase.finalDiagnoses || null,
            status: "pending",
          } as any)
          .returning();
        return caseRecord;
      } catch (error: any) {
        attempts++;
        if (error.code === '23505' && error.constraint === 'cases_case_id_unique' && attempts < maxAttempts) {
          console.log(`Case ID collision detected, retrying (attempt ${attempts + 1}/${maxAttempts})`);
          // Add small delay before retry
          await new Promise(resolve => setTimeout(resolve, 10));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Failed to create unique case ID after maximum attempts');
  }

  async getCase(id: string, userId: string): Promise<Case | undefined> {
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, id));
    
    // Only return the case if it belongs to the requesting user
    if (caseRecord && caseRecord.userId === userId) {
      return caseRecord;
    }
    return undefined;
  }

  async getCaseForAdmin(id: string): Promise<Case | undefined> {
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, id));
    
    return caseRecord;
  }

  async getCaseByCaseId(caseId: string, userId: string): Promise<Case | undefined> {
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(eq(cases.caseId, caseId));
    
    // Only return the case if it belongs to the requesting user
    if (caseRecord && caseRecord.userId === userId) {
      return caseRecord;
    }
    return undefined;
  }

  async getCaseByCaseIdForAdmin(caseId: string): Promise<Case | undefined> {
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(eq(cases.caseId, caseId));
    
    return caseRecord;
  }

  async getCases(userId: string): Promise<Case[]> {
    const userCases = await db
      .select()
      .from(cases)
      .where(eq(cases.userId, userId));
    
    return userCases.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async updateCase(id: string, userId: string, updates: Partial<Case>): Promise<Case> {
    // First check if case exists and belongs to user
    const existingCase = await this.getCase(id, userId);
    if (!existingCase) {
      throw new Error("Case not found or unauthorized");
    }
    
    const [updatedCase] = await db
      .update(cases)
      .set(updates)
      .where(eq(cases.id, id))
      .returning();
    
    return updatedCase;
  }

  async deleteCase(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(cases)
        .where(eq(cases.id, id));
      
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting case:", error);
      return false;
    }
  }

  // Settings operations
  async getUserSettings(userId: string): Promise<UserSettings> {
    console.log("getUserSettings called with userId:", userId);
    
    try {
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));
      
      console.log("Fetched settings:", settings);
      
      // If no settings exist, create default settings
      if (!settings) {
        console.log("No settings found, creating defaults for userId:", userId);
        
        const [newSettings] = await db
          .insert(userSettings)
          .values({
            userId,
            useGemini: true,
            useOpenAI: true,
            confidenceThreshold: 40,
            autoSaveCases: true,
            anonymizeData: false,
            dataRetention: "90",
            theme: "system",
            compactMode: false,
            analysisNotifications: true,
            urgentAlerts: true,
            soundNotifications: false,
          })
          .returning();
        
        console.log("Created new settings:", newSettings);
        return newSettings;
      }
      
      return settings;
    } catch (error) {
      console.error("Error in getUserSettings:", error);
      throw error;
    }
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    console.log("updateUserSettings called with userId:", userId, "updates:", updates);
    
    try {
      // First ensure settings exist
      await this.getUserSettings(userId);
      
      console.log("About to update settings for userId:", userId);
      
      const [updatedSettings] = await db
        .update(userSettings)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();
      
      console.log("Updated settings result:", updatedSettings);
      
      if (!updatedSettings) {
        throw new Error(`Failed to update settings for userId: ${userId}`);
      }
      
      return updatedSettings;
    } catch (error) {
      console.error("Error in updateUserSettings:", error);
      throw error;
    }
  }

  // Admin operations
  async getAllCasesForAdmin(): Promise<(Case & { user?: User })[]> {
    // Get all cases with user information
    const allCases = await db
      .select()
      .from(cases);
    
    // Get unique user IDs
    const userIds = [...new Set(allCases.map(c => c.userId))];
    
    // Create a map of users
    const userMap = new Map<string, User>();
    for (const userId of userIds) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user) {
        userMap.set(userId, user);
      }
    }
    
    // Combine cases with user information
    const casesWithUsers = allCases.map(caseRecord => ({
      ...caseRecord,
      user: userMap.get(caseRecord.userId)
    }));
    
    // Sort by creation date (newest first)
    return casesWithUsers.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getSystemStatistics(): Promise<{
    totalCases: number;
    pendingCases: number;
    completedCases: number;
    totalUsers: number;
    activeUsers: number;
    avgDiagnosisTime: number;
  }> {
    const allCases = await db.select().from(cases);
    const allUsers = await db.select().from(users);
    
    const totalCases = allCases.length;
    const pendingCases = allCases.filter(c => c.status === 'pending').length;
    const completedCases = allCases.filter(c => c.status === 'completed').length;
    const totalUsers = allUsers.length;
    
    // Calculate active users (users who have created cases in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCases = allCases.filter(c => {
      if (!c.createdAt) return false;
      return new Date(c.createdAt) > thirtyDaysAgo;
    });
    
    const activeUserIds = new Set(recentCases.map(c => c.userId));
    const activeUsers = activeUserIds.size;
    
    // Calculate average diagnosis time (time from case creation to completion)
    let totalDiagnosisTime = 0;
    let diagnosisCount = 0;
    
    for (const caseRecord of allCases) {
      if (caseRecord.status === 'completed' && caseRecord.createdAt) {
        // For now, we'll estimate diagnosis time as 5 minutes average
        // In a real system, you'd track actual completion time
        totalDiagnosisTime += 5;
        diagnosisCount++;
      }
    }
    
    const avgDiagnosisTime = diagnosisCount > 0 ? Math.round(totalDiagnosisTime / diagnosisCount) : 0;
    
    return {
      totalCases,
      pendingCases,
      completedCases,
      totalUsers,
      activeUsers,
      avgDiagnosisTime
    };
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    
    // Sort by creation date (newest first) and role (admins first)
    return allUsers.sort((a, b) => {
      // First sort by role (admin users first)
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      
      // Then sort by creation date (newest first)
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async promoteUserToAdmin(userId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    console.log(`[ADMIN] User ${updatedUser.email} (${userId}) promoted to admin role`);
    return updatedUser;
  }

  async demoteUserFromAdmin(userId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        role: 'user',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    console.log(`[ADMIN] User ${updatedUser.email} (${userId}) demoted from admin role`);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // First delete user's cases
      await db.delete(cases).where(eq(cases.userId, id));
      
      // Then delete user's settings
      await db.delete(userSettings).where(eq(userSettings.userId, id));
      
      // Finally delete the user
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
