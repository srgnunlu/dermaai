import { type Patient, type InsertPatient, type Case, type InsertCase, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  
  createCase(caseData: InsertCase): Promise<Case>;
  getCase(id: string): Promise<Case | undefined>;
  getCases(): Promise<Case[]>;
  updateCase(id: string, updates: Partial<Case>): Promise<Case>;
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

  async createCase(insertCase: InsertCase): Promise<Case> {
    const id = randomUUID();
    const caseId = `DR-${new Date().getFullYear()}-${String(this.caseCounter++).padStart(3, '0')}`;
    const caseRecord: Case = {
      ...insertCase,
      id,
      caseId,
      status: "pending",
      createdAt: new Date()
    };
    this.cases.set(id, caseRecord);
    return caseRecord;
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCases(): Promise<Case[]> {
    return Array.from(this.cases.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    const existingCase = this.cases.get(id);
    if (!existingCase) {
      throw new Error("Case not found");
    }
    const updatedCase = { ...existingCase, ...updates };
    this.cases.set(id, updatedCase);
    return updatedCase;
  }
}

export const storage = new MemStorage();
