/**
 * Case Helper Utilities
 * Functions for case lookup and management
 */

import { storage } from '../storage';

/**
 * Check if a parameter is a caseId (starts with "DR-") or UUID
 */
export function isCaseId(parameter: string): boolean {
  return parameter.startsWith('DR-');
}

/**
 * Lookup case by parameter (caseId or UUID) for admin users
 * Tries both lookup methods with fallback
 */
export async function lookupCaseForAdmin(parameter: string) {
  const useCaseId = isCaseId(parameter);

  if (useCaseId) {
    // Try caseId lookup first
    let caseRecord = await storage.getCaseByCaseIdForAdmin(parameter);

    // Fallback to UUID lookup
    if (!caseRecord) {
      caseRecord = await storage.getCaseForAdmin(parameter);
    }

    return caseRecord;
  } else {
    // Try UUID lookup first
    let caseRecord = await storage.getCaseForAdmin(parameter);

    // Fallback to caseId lookup
    if (!caseRecord) {
      caseRecord = await storage.getCaseByCaseIdForAdmin(parameter);
    }

    return caseRecord;
  }
}

/**
 * Lookup case by parameter (caseId or UUID) for regular users
 * Tries both lookup methods with fallback, restricted to user's own cases
 */
export async function lookupCaseForUser(parameter: string, userId: string) {
  const useCaseId = isCaseId(parameter);

  if (useCaseId) {
    // Try caseId lookup first
    let caseRecord = await storage.getCaseByCaseId(parameter, userId);

    // Fallback to UUID lookup
    if (!caseRecord) {
      caseRecord = await storage.getCase(parameter, userId);
    }

    return caseRecord;
  } else {
    // Try UUID lookup first
    let caseRecord = await storage.getCase(parameter, userId);

    // Fallback to caseId lookup
    if (!caseRecord) {
      caseRecord = await storage.getCaseByCaseId(parameter, userId);
    }

    return caseRecord;
  }
}

/**
 * Lookup case with proper authorization check
 * Routes to admin or user lookup based on user role
 */
export async function lookupCaseWithAuth(parameter: string, userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return await lookupCaseForAdmin(parameter);
  } else {
    return await lookupCaseForUser(parameter, userId);
  }
}
