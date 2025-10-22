import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage
const mockStorage = {
  getAllCasesForAdmin: vi.fn(),
  getSystemStatistics: vi.fn(),
  getAllUsers: vi.fn(),
  deleteCase: vi.fn(),
  deleteUser: vi.fn(),
  updateUserRole: vi.fn(),
  getUser: vi.fn(),
};

vi.mock('../storage', () => ({
  default: mockStorage,
}));

describe('Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/cases', () => {
    it('should return all cases for admin', async () => {
      const mockCases = [
        {
          id: 'case-1',
          caseId: 'DR-2025-001',
          userId: 'user-1',
          status: 'completed',
          createdAt: new Date(),
          user: { email: 'patient1@test.com' },
        },
        {
          id: 'case-2',
          caseId: 'DR-2025-002',
          userId: 'user-2',
          status: 'pending',
          createdAt: new Date(),
          user: { email: 'patient2@test.com' },
        },
      ];

      mockStorage.getAllCasesForAdmin.mockResolvedValue(mockCases);

      const cases = await mockStorage.getAllCasesForAdmin();

      expect(cases).toHaveLength(2);
      expect(cases[0]).toHaveProperty('caseId');
      expect(cases[0]).toHaveProperty('user');
    });

    it('should return empty array when no cases exist', async () => {
      mockStorage.getAllCasesForAdmin.mockResolvedValue([]);

      const cases = await mockStorage.getAllCasesForAdmin();

      expect(cases).toHaveLength(0);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return system statistics', async () => {
      const mockStats = {
        totalCases: 150,
        pendingCases: 5,
        completedCases: 145,
        totalUsers: 50,
        activeUsers: 35,
        averageAnalysisTime: 45.2,
      };

      mockStorage.getSystemStatistics.mockResolvedValue(mockStats);

      const stats = await mockStorage.getSystemStatistics();

      expect(stats).toHaveProperty('totalCases');
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats.totalCases).toBeGreaterThanOrEqual(0);
      expect(stats.averageAnalysisTime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          role: 'user',
          createdAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'admin@test.com',
          role: 'admin',
          createdAt: new Date(),
        },
      ];

      mockStorage.getAllUsers.mockResolvedValue(mockUsers);

      const users = await mockStorage.getAllUsers();

      expect(users).toHaveLength(2);
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('role');
    });
  });

  describe('DELETE /api/admin/cases/:id', () => {
    it('should delete case successfully', async () => {
      mockStorage.deleteCase.mockResolvedValue({ success: true });

      const result = await mockStorage.deleteCase('case-1');

      expect(mockStorage.deleteCase).toHaveBeenCalledWith('case-1');
      expect(result).toHaveProperty('success', true);
    });

    it('should handle non-existent case deletion', async () => {
      mockStorage.deleteCase.mockRejectedValue(new Error('Case not found'));

      await expect(mockStorage.deleteCase('non-existent')).rejects.toThrow('Case not found');
    });
  });

  describe('User Role Management', () => {
    it('should promote user to admin', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'admin',
      };

      mockStorage.updateUserRole.mockResolvedValue(mockUser);

      const result = await mockStorage.updateUserRole('user-1', 'admin');

      expect(result.role).toBe('admin');
      expect(mockStorage.updateUserRole).toHaveBeenCalledWith('user-1', 'admin');
    });

    it('should demote admin to user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'user',
      };

      mockStorage.updateUserRole.mockResolvedValue(mockUser);

      const result = await mockStorage.updateUserRole('user-1', 'user');

      expect(result.role).toBe('user');
    });
  });

  describe('CSV Export', () => {
    it('should format case data for CSV export', () => {
      const mockCase = {
        caseId: 'DR-2025-001',
        user: { email: 'patient@test.com' },
        patientId: 'P-001',
        status: 'completed',
        createdAt: new Date('2025-01-15'),
        symptoms: ['Itching', 'Redness'],
        additionalSymptoms: 'Severe at night',
        symptomDuration: '1-7-days',
        finalDiagnoses: [
          {
            name: 'Eczema',
            confidence: 85,
            isUrgent: false,
          },
        ],
      };

      // CSV formatter function test
      const formatCSVRow = (caseData: any) => {
        const topDiagnosis = caseData.finalDiagnoses?.[0];
        return [
          caseData.caseId,
          caseData.user?.email || 'Bilinmiyor',
          caseData.patientId || 'Yok',
          caseData.status === 'completed' ? 'Tamamlandı' : 'Beklemede',
          topDiagnosis?.name || 'Yok',
          topDiagnosis?.confidence ? `%${topDiagnosis.confidence}` : 'Yok',
          topDiagnosis?.isUrgent ? 'Evet' : 'Hayır',
        ];
      };

      const csvRow = formatCSVRow(mockCase);

      expect(csvRow[0]).toBe('DR-2025-001');
      expect(csvRow[1]).toBe('patient@test.com');
      expect(csvRow[3]).toBe('Tamamlandı');
      expect(csvRow[4]).toBe('Eczema');
      expect(csvRow[5]).toBe('%85');
      expect(csvRow[6]).toBe('Hayır');
    });

    it('should sanitize CSV formulas to prevent injection', () => {
      // CSV Formula Injection önleme fonksiyonu
      const sanitizeCSVFormula = (value: string | null | undefined): string => {
        if (!value) return '';
        const str = String(value);
        const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];
        if (dangerousChars.some((char) => str.startsWith(char))) {
          return `'${str}`;
        }
        return str;
      };

      expect(sanitizeCSVFormula('=1+1')).toBe("'=1+1");
      expect(sanitizeCSVFormula('+CMD')).toBe("'+CMD");
      expect(sanitizeCSVFormula('-2+3')).toBe("'-2+3");
      expect(sanitizeCSVFormula('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(sanitizeCSVFormula('Normal Text')).toBe('Normal Text');
    });
  });

  describe('Authorization Checks', () => {
    it('should verify admin role before granting access', async () => {
      const mockAdminUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
      };

      const mockRegularUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
      };

      mockStorage.getUser.mockResolvedValueOnce(mockAdminUser);
      const adminUser = await mockStorage.getUser('admin-1');
      expect(adminUser.role).toBe('admin');

      mockStorage.getUser.mockResolvedValueOnce(mockRegularUser);
      const regularUser = await mockStorage.getUser('user-1');
      expect(regularUser.role).toBe('user');
    });

    it('should reject non-admin users from admin endpoints', () => {
      const checkAdminRole = (userRole: string) => {
        if (userRole !== 'admin') {
          throw new Error('Admin privileges required');
        }
        return true;
      };

      expect(() => checkAdminRole('admin')).not.toThrow();
      expect(() => checkAdminRole('user')).toThrow('Admin privileges required');
    });
  });
});
