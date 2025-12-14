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
  type SystemSettings,
  type UpdateSystemSettings,
  type PushToken,
  type InsertPushToken,
  patients,
  cases,
  users,
  userSettings,
  systemSettings,
  pushTokens,
} from '@shared/schema';
import { db } from './db';
import { eq, and, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import logger from './logger';
import * as cache from './cache';

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Profile operations
  getUserProfile(userId: string): Promise<User | undefined>;
  updateUserProfile(userId: string, profileData: UpdateUserProfile): Promise<User>;
  getUserStatistics(
    userId: string
  ): Promise<{ totalCases: number; thisMonthCases: number; accuracyRate: number }>;

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
  getCasesForDermatologist(): Promise<Case[]>;
  updateCaseDermatologistDiagnosis(
    caseId: string,
    dermatologistId: string,
    diagnosis: string,
    notes?: string
  ): Promise<Case | undefined>;
  updateCase(id: string, userId: string, updates: Partial<Case>): Promise<Case>;
  deleteCase(id: string): Promise<boolean>;

  // Settings operations
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;

  // Admin operations
  getAllCasesForAdmin(): Promise<(Case & { user?: User })[]>;
  getCasesForAdminPaginated(
    page: number,
    limit: number
  ): Promise<{ cases: (Case & { user?: User })[]; total: number; pages: number }>;
  getUsersPaginated(
    page: number,
    limit: number
  ): Promise<{ users: User[]; total: number; pages: number }>;
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
  // System settings
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(updates: UpdateSystemSettings): Promise<SystemSettings>;
  // Analytics operations
  getAnalyticsDiagnosisDistribution(): Promise<
    Array<{ diagnosis: string; count: number; percentage: number }>
  >;
  getAnalyticsTimeSeriesData(
    days: number
  ): Promise<Array<{ date: string; total: number; completed: number; pending: number }>>;
  getAnalyticsAIPerformance(): Promise<{
    gemini: { total: number; avgConfidence: number; avgTime: number };
    openai: { total: number; avgConfidence: number; avgTime: number };
    consensus: number;
  }>;
  getAnalyticsUserActivity(): Promise<
    Array<{ userId: string; email: string; casesCount: number; lastActive: Date | null }>
  >;
  getAnalyticsAISelectionStats(): Promise<{
    gemini: number;
    openai: number;
    total: number;
    geminiPercentage: number;
    openaiPercentage: number;
  }>;

  // Push notification token operations
  savePushToken(userId: string, token: string, platform?: string, deviceId?: string): Promise<PushToken>;
  getUserPushTokens(userId: string): Promise<PushToken[]>;
  deletePushToken(token: string): Promise<boolean>;
  deleteUserPushTokens(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async getUserStatistics(
    userId: string
  ): Promise<{ totalCases: number; thisMonthCases: number; accuracyRate: number }> {
    const userCases = await db.select().from(cases).where(eq(cases.userId, userId));

    const totalCases = userCases.length;

    // Calculate this month's cases
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthCases = userCases.filter((c) => {
      if (!c.createdAt) return false;
      const caseDate = new Date(c.createdAt);
      return caseDate.getMonth() === currentMonth && caseDate.getFullYear() === currentYear;
    }).length;

    // Calculate accuracy rate (simulated for now - would need feedback system)
    // For now, we'll calculate based on confidence scores
    let totalConfidence = 0;
    let validCases = 0;

    userCases.forEach((c) => {
      if (c.finalDiagnoses && c.finalDiagnoses.length > 0) {
        totalConfidence += c.finalDiagnoses[0].confidence;
        validCases++;
      }
    });

    const accuracyRate = validCases > 0 ? Math.round(totalConfidence / validCases) : 0;

    return {
      totalCases,
      thisMonthCases,
      accuracyRate,
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
          patientId: insertPatient.patientId || `PAT-${Date.now()}-${nanoid(8)}`,
        };

        const [patient] = await db.insert(patients).values(patientData).returning();
        return patient;
      } catch (error: any) {
        attempts++;
        if (error.code === '23505' && error.constraint === 'patients_patient_id_unique') {
          if (attempts < maxAttempts) {
            logger.debug(
              `Patient ID collision detected for ID: ${insertPatient.patientId}, retrying (attempt ${attempts + 1}/${maxAttempts})`
            );
            // Generate a new unique patient ID by appending timestamp and random string
            insertPatient.patientId = `${insertPatient.patientId || 'PAT'}-${Date.now()}-${nanoid(6)}`;
            continue;
          } else {
            throw new Error(
              `Patient ID '${insertPatient.patientId}' already exists. Please use a different patient ID.`
            );
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
            imageUrls: insertCase.imageUrls || null, // Add imageUrls array
            lesionLocation: insertCase.lesionLocation || null,
            symptoms: insertCase.symptoms || null,
            additionalSymptoms: insertCase.additionalSymptoms || null,
            symptomDuration: insertCase.symptomDuration || null,
            medicalHistory: insertCase.medicalHistory || null,
            geminiAnalysis: insertCase.geminiAnalysis || null,
            openaiAnalysis: insertCase.openaiAnalysis || null,
            finalDiagnoses: insertCase.finalDiagnoses || null,
            status: 'pending',
          } as any)
          .returning();

        // Invalidate admin cache when new case is created
        cache.invalidatePattern('admin:');

        return caseRecord;
      } catch (error: any) {
        attempts++;
        if (
          error.code === '23505' &&
          error.constraint === 'cases_case_id_unique' &&
          attempts < maxAttempts
        ) {
          logger.debug(
            `Case ID collision detected, retrying (attempt ${attempts + 1}/${maxAttempts})`
          );
          // Add small delay before retry
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to create unique case ID after maximum attempts');
  }

  async getCase(id: string, userId: string): Promise<Case | undefined> {
    const [caseRecord] = await db.select().from(cases).where(eq(cases.id, id));

    // Only return the case if it belongs to the requesting user
    if (caseRecord && caseRecord.userId === userId) {
      return caseRecord;
    }
    return undefined;
  }

  async getCaseForAdmin(id: string): Promise<Case | undefined> {
    const [caseRecord] = await db.select().from(cases).where(eq(cases.id, id));

    return caseRecord;
  }

  async getCaseByCaseId(caseId: string, userId: string): Promise<Case | undefined> {
    const [caseRecord] = await db.select().from(cases).where(eq(cases.caseId, caseId));

    // Only return the case if it belongs to the requesting user
    if (caseRecord && caseRecord.userId === userId) {
      return caseRecord;
    }
    return undefined;
  }

  async getCaseByCaseIdForAdmin(caseId: string): Promise<Case | undefined> {
    const [caseRecord] = await db.select().from(cases).where(eq(cases.caseId, caseId));

    return caseRecord;
  }

  async getCases(userId: string): Promise<Case[]> {
    // Filter out hidden cases (those with anonymization enabled)
    const userCases = await db.select().from(cases).where(
      and(
        eq(cases.userId, userId),
        or(eq(cases.isHidden, false), sql`${cases.isHidden} IS NULL`)
      )
    );

    return userCases.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getCasesForDermatologist(): Promise<Case[]> {
    // Return all cases with status 'completed' but WITHOUT AI analysis data (blind review)
    const allCases = await db
      .select()
      .from(cases)
      .where(eq(cases.status, 'completed'));

    // Remove AI analysis data for blind review
    return allCases.map(c => ({
      ...c,
      geminiAnalysis: null,
      openaiAnalysis: null,
      finalDiagnoses: null,
    })).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async updateCaseDermatologistDiagnosis(
    caseId: string,
    dermatologistId: string,
    diagnosis: string,
    notes?: string
  ): Promise<Case | undefined> {
    try {
      const [updatedCase] = await db
        .update(cases)
        .set({
          dermatologistDiagnosis: diagnosis,
          dermatologistNotes: notes || null,
          dermatologistDiagnosedBy: dermatologistId,
          dermatologistDiagnosedAt: new Date(),
        })
        .where(eq(cases.id, caseId))
        .returning();

      // Invalidate admin cache
      cache.invalidatePattern('admin:');

      return updatedCase;
    } catch (error) {
      logger.error('Error updating dermatologist diagnosis:', error);
      throw error;
    }
  }

  async updateCase(id: string, userId: string, updates: Partial<Case>): Promise<Case> {
    // First check if case exists and belongs to user
    const existingCase = await this.getCase(id, userId);
    if (!existingCase) {
      throw new Error('Case not found or unauthorized');
    }

    const [updatedCase] = await db.update(cases).set(updates).where(eq(cases.id, id)).returning();

    // Invalidate admin cache when case is updated
    cache.invalidatePattern('admin:');

    return updatedCase;
  }

  async deleteCase(id: string): Promise<boolean> {
    try {
      const result = await db.delete(cases).where(eq(cases.id, id));

      // Invalidate admin cache when case is deleted
      if (result.rowCount && result.rowCount > 0) {
        cache.invalidatePattern('admin:');
      }

      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error deleting case:', error);
      return false;
    }
  }

  // Settings operations
  async getUserSettings(userId: string): Promise<UserSettings> {
    logger.debug('getUserSettings called with userId:', userId);

    try {
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));

      logger.debug('Fetched settings:', settings);

      // If no settings exist, create default settings
      if (!settings) {
        logger.debug('No settings found, creating defaults for userId:', userId);

        const [newSettings] = await db
          .insert(userSettings)
          .values({
            userId,
            useGemini: true,
            useOpenAI: true,
            confidenceThreshold: 40,
            autoSaveCases: true,
            anonymizeData: false,
            dataRetention: '90',
            theme: 'system',
            compactMode: false,
            analysisNotifications: true,
            urgentAlerts: true,
            soundNotifications: false,
          })
          .returning();

        logger.debug('Created new settings:', newSettings);
        return newSettings;
      }

      return settings;
    } catch (error) {
      logger.error('Error in getUserSettings:', error);
      throw error;
    }
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    logger.debug('updateUserSettings called with userId:', userId, 'updates:', updates);

    try {
      // First ensure settings exist
      await this.getUserSettings(userId);

      logger.debug('About to update settings for userId:', userId);

      const [updatedSettings] = await db
        .update(userSettings)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();

      logger.debug('Updated settings result:', updatedSettings);

      if (!updatedSettings) {
        throw new Error(`Failed to update settings for userId: ${userId}`);
      }

      return updatedSettings;
    } catch (error) {
      logger.error('Error in updateUserSettings:', error);
      throw error;
    }
  }

  // Admin operations
  async getAllCasesForAdmin(): Promise<(Case & { user?: User })[]> {
    // Use cache for expensive query (2 minute TTL)
    return cache.cached(
      'admin:all-cases',
      async () => {
        // Get all cases with user information
        const allCases = await db.select().from(cases);

        // Get unique user IDs
        const userIds = Array.from(new Set(allCases.map((c) => c.userId)));

        // Create a map of users
        const userMap = new Map<string, User>();
        for (const userId of userIds) {
          const [user] = await db.select().from(users).where(eq(users.id, userId));
          if (user) {
            userMap.set(userId, user);
          }
        }

        // Combine cases with user information
        const casesWithUsers = allCases.map((caseRecord) => {
          // Ensure imageUrls is always an array
          const imageUrls = caseRecord.imageUrls && Array.isArray(caseRecord.imageUrls)
            ? caseRecord.imageUrls
            : [];

          return {
            ...caseRecord,
            imageUrls: imageUrls, // Explicitly ensure it's set
            user: userMap.get(caseRecord.userId),
          };
        });

        // Sort by creation date (newest first)
        return casesWithUsers.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      },
      120 // 2 minutes cache
    );
  }

  async getCasesForAdminPaginated(
    page: number = 1,
    limit: number = 20
  ): Promise<{ cases: (Case & { user?: User })[]; total: number; pages: number }> {
    // Get total count
    const allCases = await db.select().from(cases);
    const total = allCases.length;

    // Calculate pagination
    const offset = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Get unique user IDs
    const userIds = Array.from(new Set(allCases.map((c) => c.userId)));

    // Create a map of users
    const userMap = new Map<string, User>();
    for (const userId of userIds) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user) {
        userMap.set(userId, user);
      }
    }

    // Combine cases with user information
    const casesWithUsers = allCases.map((caseRecord) => ({
      ...caseRecord,
      user: userMap.get(caseRecord.userId),
    }));

    // Sort by creation date (newest first) and paginate
    const sortedCases = casesWithUsers.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const paginatedCases = sortedCases.slice(offset, offset + limit);

    return {
      cases: paginatedCases,
      total,
      pages,
    };
  }

  async getUsersPaginated(
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: User[]; total: number; pages: number }> {
    const allUsers = await db.select().from(users);
    const total = allUsers.length;

    // Calculate pagination
    const offset = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Sort by creation date (newest first) and paginate
    const sortedUsers = allUsers.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const paginatedUsers = sortedUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      pages,
    };
  }

  async getSystemStatistics(): Promise<{
    totalCases: number;
    pendingCases: number;
    completedCases: number;
    totalUsers: number;
    activeUsers: number;
    avgDiagnosisTime: number;
  }> {
    // Use cache for expensive statistics calculation (2 minute TTL)
    return cache.cached(
      'admin:stats',
      async () => {
        const allCases = await db.select().from(cases);
        const allUsers = await db.select().from(users);

        const totalCases = allCases.length;
        const pendingCases = allCases.filter((c) => c.status === 'pending').length;
        const completedCases = allCases.filter((c) => c.status === 'completed').length;
        const totalUsers = allUsers.length;

        // Calculate active users (users who have created cases in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCases = allCases.filter((c) => {
          if (!c.createdAt) return false;
          return new Date(c.createdAt) > thirtyDaysAgo;
        });

        const activeUserIds = new Set(recentCases.map((c) => c.userId));
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

        const avgDiagnosisTime =
          diagnosisCount > 0 ? Math.round(totalDiagnosisTime / diagnosisCount) : 0;

        return {
          totalCases,
          pendingCases,
          completedCases,
          totalUsers,
          activeUsers,
          avgDiagnosisTime,
        };
      },
      120 // 2 minutes cache
    );
  }

  async getAllUsers(): Promise<User[]> {
    // Use cache for user list (2 minute TTL)
    return cache.cached(
      'admin:all-users',
      async () => {
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
      },
      120 // 2 minutes cache
    );
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

    logger.debug(`[ADMIN] User ${updatedUser.email} (${userId}) promoted to admin role`);
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

    logger.debug(`[ADMIN] User ${updatedUser.email} (${userId}) demoted from admin role`);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // First delete user's cases
      await db.delete(cases).where(eq(cases.userId, id));

      // Then delete user's settings
      await db.delete(userSettings).where(eq(userSettings.userId, id));

      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, id));

      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error deleting user:', error);
      return false;
    }
  }

  // System settings
  async getSystemSettings(): Promise<SystemSettings> {
    const [row] = await db.select().from(systemSettings).limit(1);
    if (row) return row as SystemSettings;
    const [created] = await db
      .insert(systemSettings)
      .values({
        enableGemini: true,
        enableOpenAI: true,
        openaiModel: 'gpt-4o-mini',
        openaiAllowFallback: true,
      })
      .returning();
    return created as SystemSettings;
  }

  async updateSystemSettings(updates: UpdateSystemSettings): Promise<SystemSettings> {
    const current = await this.getSystemSettings();
    const [updated] = await db
      .update(systemSettings)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(systemSettings.id, current.id))
      .returning();
    return updated as SystemSettings;
  }

  // Analytics operations
  async getAnalyticsDiagnosisDistribution(): Promise<
    Array<{ diagnosis: string; count: number; percentage: number }>
  > {
    return cache.cached(
      'analytics:diagnosis-distribution',
      async () => {
        const allCases = await db.select().from(cases);
        const diagnosisMap = new Map<string, number>();

        // Count each diagnosis from both AI analyses
        for (const caseRecord of allCases) {
          // Count Gemini diagnoses
          if (caseRecord.geminiAnalysis && (caseRecord.geminiAnalysis as any).diagnoses) {
            const diagnoses = (caseRecord.geminiAnalysis as any).diagnoses;
            if (Array.isArray(diagnoses)) {
              for (const diagnosis of diagnoses) {
                const name = diagnosis.name || 'Unknown';
                diagnosisMap.set(name, (diagnosisMap.get(name) || 0) + 1);
              }
            }
          }
          // Count OpenAI diagnoses
          if (caseRecord.openaiAnalysis && (caseRecord.openaiAnalysis as any).diagnoses) {
            const diagnoses = (caseRecord.openaiAnalysis as any).diagnoses;
            if (Array.isArray(diagnoses)) {
              for (const diagnosis of diagnoses) {
                const name = diagnosis.name || 'Unknown';
                diagnosisMap.set(name, (diagnosisMap.get(name) || 0) + 1);
              }
            }
          }
        }

        const total = Array.from(diagnosisMap.values()).reduce((sum, count) => sum + count, 0);

        // Convert to array and calculate percentages
        const distribution = Array.from(diagnosisMap.entries())
          .map(([diagnosis, count]) => ({
            diagnosis,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 diagnoses

        return distribution;
      },
      300 // 5 minutes cache
    );
  }

  async getAnalyticsTimeSeriesData(
    days: number = 30
  ): Promise<Array<{ date: string; total: number; completed: number; pending: number }>> {
    return cache.cached(
      `analytics:timeseries:${days}`,
      async () => {
        const allCases = await db.select().from(cases);
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Group cases by date
        const dateMap = new Map<string, { total: number; completed: number; pending: number }>();

        for (const caseRecord of allCases) {
          if (!caseRecord.createdAt) continue;

          const caseDate = new Date(caseRecord.createdAt);
          if (caseDate < startDate) continue;

          const dateKey = caseDate.toISOString().split('T')[0]; // YYYY-MM-DD
          const stats = dateMap.get(dateKey) || { total: 0, completed: 0, pending: 0 };

          stats.total++;
          if (caseRecord.status === 'completed') stats.completed++;
          if (caseRecord.status === 'pending') stats.pending++;

          dateMap.set(dateKey, stats);
        }

        // Fill in missing dates with zeros
        const result: Array<{ date: string; total: number; completed: number; pending: number }> =
          [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateKey = date.toISOString().split('T')[0];
          const stats = dateMap.get(dateKey) || { total: 0, completed: 0, pending: 0 };
          result.push({ date: dateKey, ...stats });
        }

        return result;
      },
      300 // 5 minutes cache
    );
  }

  async getAnalyticsAIPerformance(): Promise<{
    gemini: { total: number; avgConfidence: number; avgTime: number };
    openai: { total: number; avgConfidence: number; avgTime: number };
    consensus: number;
  }> {
    return cache.cached(
      'analytics:ai-performance',
      async () => {
        const allCases = await db.select().from(cases);

        let geminiTotal = 0;
        let geminiConfidenceSum = 0;
        let geminiTimeSum = 0;

        let openaiTotal = 0;
        let openaiConfidenceSum = 0;
        let openaiTimeSum = 0;

        let consensusCount = 0;

        for (const caseRecord of allCases) {
          // Gemini stats
          if (caseRecord.geminiAnalysis) {
            geminiTotal++;
            const analysis = caseRecord.geminiAnalysis as any;
            if (analysis.analysisTime) geminiTimeSum += analysis.analysisTime;
            if (analysis.diagnoses && Array.isArray(analysis.diagnoses)) {
              const avgConf =
                analysis.diagnoses.reduce((sum: number, d: any) => sum + (d.confidence || 0), 0) /
                analysis.diagnoses.length;
              geminiConfidenceSum += avgConf;
            }
          }

          // OpenAI stats
          if (caseRecord.openaiAnalysis) {
            openaiTotal++;
            const analysis = caseRecord.openaiAnalysis as any;
            if (analysis.analysisTime) openaiTimeSum += analysis.analysisTime;
            if (analysis.diagnoses && Array.isArray(analysis.diagnoses)) {
              const avgConf =
                analysis.diagnoses.reduce((sum: number, d: any) => sum + (d.confidence || 0), 0) /
                analysis.diagnoses.length;
              openaiConfidenceSum += avgConf;
            }
          }

          // Consensus (both models analyzed)
          if (caseRecord.geminiAnalysis && caseRecord.openaiAnalysis) {
            consensusCount++;
          }
        }

        return {
          gemini: {
            total: geminiTotal,
            avgConfidence: geminiTotal > 0 ? Math.round(geminiConfidenceSum / geminiTotal) : 0,
            avgTime: geminiTotal > 0 ? Math.round((geminiTimeSum / geminiTotal) * 10) / 10 : 0,
          },
          openai: {
            total: openaiTotal,
            avgConfidence: openaiTotal > 0 ? Math.round(openaiConfidenceSum / openaiTotal) : 0,
            avgTime: openaiTotal > 0 ? Math.round((openaiTimeSum / openaiTotal) * 10) / 10 : 0,
          },
          consensus: allCases.length > 0 ? Math.round((consensusCount / allCases.length) * 100) : 0,
        };
      },
      300 // 5 minutes cache
    );
  }

  async getAnalyticsUserActivity(): Promise<
    Array<{ userId: string; email: string; casesCount: number; lastActive: Date | null }>
  > {
    return cache.cached(
      'analytics:user-activity',
      async () => {
        const allUsers = await db.select().from(users);
        const allCases = await db.select().from(cases);

        // Count cases per user and find last activity
        const userStatsMap = new Map<
          string,
          { email: string; casesCount: number; lastActive: Date | null }
        >();

        for (const user of allUsers) {
          userStatsMap.set(user.id, {
            email: user.email || 'No email',
            casesCount: 0,
            lastActive: null,
          });
        }

        for (const caseRecord of allCases) {
          const stats = userStatsMap.get(caseRecord.userId);
          if (stats) {
            stats.casesCount++;
            const caseDate = caseRecord.createdAt ? new Date(caseRecord.createdAt) : null;
            if (caseDate && (!stats.lastActive || caseDate > stats.lastActive)) {
              stats.lastActive = caseDate;
            }
          }
        }

        // Convert to array and sort by cases count
        return Array.from(userStatsMap.entries())
          .map(([userId, stats]) => ({
            userId,
            email: stats.email,
            casesCount: stats.casesCount,
            lastActive: stats.lastActive,
          }))
          .sort((a, b) => b.casesCount - a.casesCount)
          .slice(0, 20); // Top 20 active users
      },
      300 // 5 minutes cache
    );
  }

  // AI Selection Statistics
  async getAnalyticsAISelectionStats(): Promise<{
    gemini: number;
    openai: number;
    total: number;
    geminiPercentage: number;
    openaiPercentage: number;
  }> {
    return cache.cached(
      'analytics:ai-selection-stats',
      async () => {
        const allCases = await db.select().from(cases);

        // Count only completed cases where user has made an AI selection
        const completedCases = allCases.filter(c => c.status === 'completed');

        let geminiCount = 0;
        let openaiCount = 0;

        for (const caseRecord of completedCases) {
          const provider = caseRecord.selectedAnalysisProvider;
          if (provider === 'gemini') {
            geminiCount++;
          } else if (provider === 'openai') {
            openaiCount++;
          }
        }

        const total = geminiCount + openaiCount;
        const geminiPercentage = total > 0 ? Math.round((geminiCount / total) * 100) : 0;
        const openaiPercentage = total > 0 ? Math.round((openaiCount / total) * 100) : 0;

        return {
          gemini: geminiCount,
          openai: openaiCount,
          total,
          geminiPercentage,
          openaiPercentage,
        };
      },
      300 // 5 minutes cache
    );
  }

  // Push notification token operations
  async savePushToken(
    userId: string,
    token: string,
    platform?: string,
    deviceId?: string
  ): Promise<PushToken> {
    // First, check if this token already exists
    const [existingToken] = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token));

    if (existingToken) {
      // Update existing token (might be for a different user after logout/login)
      const [updatedToken] = await db
        .update(pushTokens)
        .set({
          userId,
          platform: platform || existingToken.platform,
          deviceId: deviceId || existingToken.deviceId,
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.id, existingToken.id))
        .returning();
      return updatedToken;
    }

    // Create new token
    const [newToken] = await db
      .insert(pushTokens)
      .values({
        userId,
        token,
        platform,
        deviceId,
      })
      .returning();

    return newToken;
  }

  async getUserPushTokens(userId: string): Promise<PushToken[]> {
    return await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
  }

  async deletePushToken(token: string): Promise<boolean> {
    try {
      const result = await db
        .delete(pushTokens)
        .where(eq(pushTokens.token, token));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error deleting push token:', error);
      return false;
    }
  }

  async deleteUserPushTokens(userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(pushTokens)
        .where(eq(pushTokens.userId, userId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error deleting user push tokens:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
