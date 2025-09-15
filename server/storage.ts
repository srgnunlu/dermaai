import { type Patient, type InsertPatient, type Case, type InsertCase, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  
  createCase(caseData: InsertCase, userId: string): Promise<Case>;
  getCase(id: string, userId: string): Promise<Case | undefined>;
  getCases(userId: string): Promise<Case[]>;
  updateCase(id: string, userId: string, updates: Partial<Case>): Promise<Case>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private cases: Map<string, Case>;
  private caseCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.cases = new Map();
    
    // Create a temporary dev user for testing authentication
    // In production, this should be removed and handled by proper user registration
    const devUserId = "dev-user-123";
    const devUser: User = {
      id: devUserId,
      username: "dev-user",
      password: "dev-password"
    };
    this.users.set(devUserId, devUser);
    console.log(`[SECURITY] Created temporary dev user with ID: ${devUserId} for authentication testing`);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = { 
      ...insertPatient, 
      id,
      age: insertPatient.age ?? null,
      gender: insertPatient.gender ?? null,
      skinType: insertPatient.skinType ?? null,
      createdAt: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.patientId === patientId,
    );
  }

  async createCase(insertCase: InsertCase, userId: string): Promise<Case> {
    const id = randomUUID();
    const caseId = `DR-${new Date().getFullYear()}-${String(this.caseCounter++).padStart(3, '0')}`;
    const caseRecord: Case = {
      ...insertCase,
      id,
      caseId,
      userId,
      patientId: insertCase.patientId ?? null,
      lesionLocation: insertCase.lesionLocation ?? null,
      symptoms: insertCase.symptoms ?? null,
      medicalHistory: insertCase.medicalHistory ?? null,
      geminiAnalysis: null,
      openaiAnalysis: null,
      finalDiagnoses: null,
      status: "pending",
      createdAt: new Date()
    };
    this.cases.set(id, caseRecord);
    return caseRecord;
  }

  async getCase(id: string, userId: string): Promise<Case | undefined> {
    const caseRecord = this.cases.get(id);
    // Only return the case if it belongs to the requesting user
    if (caseRecord && caseRecord.userId === userId) {
      return caseRecord;
    }
    return undefined;
  }

  async getCases(userId: string): Promise<Case[]> {
    return Array.from(this.cases.values())
      .filter(caseRecord => caseRecord.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateCase(id: string, userId: string, updates: Partial<Case>): Promise<Case> {
    const existingCase = this.cases.get(id);
    if (!existingCase) {
      throw new Error("Case not found");
    }
    // Only allow updates if the case belongs to the requesting user
    if (existingCase.userId !== userId) {
      throw new Error("Unauthorized: Cannot access case");
    }
    const updatedCase = { ...existingCase, ...updates };
    this.cases.set(id, updatedCase);
    return updatedCase;
  }
}

export const storage = new MemStorage();
