import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';
import Project from '../../src/models/project.model.js';

// We need dotenv to load env variables
import 'dotenv/config';

describe('Project API Integration Tests', () => {
  let token;
  let testUser;

  // Setup: Connect to DB and create a test user
  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // Clean up any existing test data
    await User.deleteOne({ email: 'testuser@test.com' });
    await Project.deleteMany({ name: 'Test Project Integration' });

    // Register a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@test.com',
        password: 'password123',
        displayName: 'Test User',
      });

    testUser = registerResponse.body;

    // Login to get the JWT token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@test.com',
        password: 'password123',
      });

    token = loginResponse.body.token;
  });

  // Cleanup: Remove test data and close connection
  afterAll(async () => {
    await User.deleteOne({ email: 'testuser@test.com' });
    await Project.deleteMany({ name: 'Test Project Integration' });
    await mongoose.connection.close();
  });

  // Test: Create a project with valid token
  it('POST /api/projects - should create a project with valid token', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Project Integration',
        description: 'This is a test project',
      });

    // Expect 201 Created
    expect(response.status).toBe(201);

    // Expect project name in response
    expect(response.body.name).toBe('Test Project Integration');
    expect(response.body.description).toBe('This is a test project');

    // Expect owner to be set
    expect(response.body.owner).toBeDefined();
  });

  // Test: Should fail without token
  it('POST /api/projects - should fail without token', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        name: 'Unauthorized Project',
        description: 'This should fail',
      });

    // Expect 401 Unauthorized
    expect(response.status).toBe(401);
  });

  // Test: Get projects with valid token
  it('GET /api/projects - should return user projects', async () => {
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    // Expect 200 OK
    expect(response.status).toBe(200);

    // Expect an array of projects
    expect(Array.isArray(response.body)).toBe(true);

    // Should contain our test project
    const testProject = response.body.find(p => p.name === 'Test Project Integration');
    expect(testProject).toBeDefined();
  });
});
