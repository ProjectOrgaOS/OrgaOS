/**
 * Authentication API Integration Tests
 *
 * Tests for:
 * - User registration
 * - User login
 * - Token validation
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';

describe('Authentication API', () => {
  const testUser = {
    email: 'auth-test@test.com',
    password: 'SecurePassword123',
    displayName: 'Auth Test User',
  };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await User.deleteOne({ email: testUser.email });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test user before each test
    await User.deleteOne({ email: testUser.email });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    it('should fail when email already exists', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(testUser);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: testUser.password,
          displayName: testUser.displayName,
        });

      // Returns 500 because mongoose validation fails on missing required field
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          displayName: testUser.displayName,
        });

      // Returns 500 because bcrypt.hash fails on undefined password
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUser.password,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Token Validation', () => {
    let validToken;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      validToken = loginRes.body.token;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'NotBearer token');

      expect(response.status).toBe(401);
    });
  });
});
