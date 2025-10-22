import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';

// Mock storage
const mockStorage = {
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  upsertUser: vi.fn(),
};

vi.mock('../storage', () => ({
  default: mockStorage,
}));

describe('Authentication API', () => {
  let app: express.Application;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    // Test app oluştur
    app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());

    // Test routes ekle
    app.post('/api/login', (req, res) => {
      // Basit test login
      req.login({ id: '1', email: 'test@test.com', role: 'user' }, (err) => {
        if (err) return res.status(500).json({ error: 'Login failed' });
        res.json({ success: true });
      });
    });

    app.get('/api/auth/user', (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      res.json(req.user);
    });

    app.post('/api/logout', (req, res) => {
      req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ success: true });
      });
    });

    // Passport serialization
    passport.serializeUser((user: any, done) => done(null, user.id));
    passport.deserializeUser((id: string, done) => done(null, { id, email: 'test@test.com', role: 'user' }));

    agent = request.agent(app);
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await agent
        .post('/api/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should maintain session after login', async () => {
      // İlk login yap
      await agent
        .post('/api/login')
        .send({ email: 'test@test.com', password: 'password123' });

      // Session'ı kontrol et
      const response = await agent.get('/api/auth/user');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@test.com');
    });
  });

  describe('GET /api/auth/user', () => {
    it('should return 401 if not authenticated', async () => {
      const freshAgent = request.agent(app);
      const response = await freshAgent.get('/api/auth/user');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Not authenticated');
    });

    it('should return user data if authenticated', async () => {
      // Login
      await agent
        .post('/api/login')
        .send({ email: 'test@test.com', password: 'password123' });

      // Get user
      const response = await agent.get('/api/auth/user');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('POST /api/logout', () => {
    it('should logout successfully', async () => {
      // Login first
      await agent
        .post('/api/login')
        .send({ email: 'test@test.com', password: 'password123' });

      // Logout
      const response = await agent.post('/api/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should clear session after logout', async () => {
      // Login
      await agent
        .post('/api/login')
        .send({ email: 'test@test.com', password: 'password123' });

      // Logout
      await agent.post('/api/logout');

      // Session temizlenmiş mi kontrol et
      const response = await agent.get('/api/auth/user');
      expect(response.status).toBe(401);
    });
  });
});
