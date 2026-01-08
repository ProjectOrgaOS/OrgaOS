/**
 * Task API Integration Tests
 *
 * Tests for:
 * - Task CRUD operations
 * - Task status updates
 * - Task priority updates
 * - Authorization checks
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';
import Project from '../../src/models/project.model.js';
import Task from '../../src/models/task.model.js';

describe('Task API', () => {
  let token;
  let testProject;
  const testEmail = 'task-test@test.com';

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Clean up
    await User.deleteOne({ email: testEmail });
    await Project.deleteMany({ name: 'Task Test Project' });
    await Task.deleteMany({ title: /^Test Task/ });

    // Register and login
    await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: 'password123',
      displayName: 'Task Tester',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'password123',
    });
    token = loginRes.body.token;

    // Create a project for tasks
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Task Test Project',
        description: 'Project for task tests',
      });
    testProject = projectRes.body;
  });

  afterAll(async () => {
    await Task.deleteMany({ project: testProject?._id });
    await Project.deleteMany({ name: 'Task Test Project' });
    await User.deleteOne({ email: testEmail });
    await mongoose.connection.close();
  });

  describe('POST /api/tasks', () => {
    it('should create a task successfully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task Create',
          description: 'Test description',
          projectId: testProject._id,
          priority: 'High',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Task Create');
      expect(response.body.status).toBe('To Do');
      expect(response.body.priority).toBe('High');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Unauthorized Task',
          projectId: testProject._id,
        });

      expect(response.status).toBe(401);
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing title and projectId',
        });

      // Returns 403 (no project found) or 500 (validation error)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should use default priority when not specified', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task Default Priority',
          projectId: testProject._id,
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('Medium');
    });
  });

  describe('GET /api/tasks/project/:projectId', () => {
    beforeEach(async () => {
      await Task.deleteMany({ project: testProject._id });
      // Create some test tasks
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Task 1', projectId: testProject._id });
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Task 2', projectId: testProject._id });
    });

    it('should get all tasks for a project', async () => {
      const response = await request(app)
        .get(`/api/tasks/project/${testProject._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/tasks/project/${testProject._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/tasks/:id/status', () => {
    let testTask;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task Status Update',
          projectId: testProject._id,
        });
      testTask = response.body;
    });

    it('should update task status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'In Progress' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('In Progress');
    });

    it('should update to Done status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Done' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Done');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task Priority Update',
          projectId: testProject._id,
          priority: 'Low',
        });
      testTask = response.body;
    });

    it('should update task priority', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ priority: 'High' });

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe('High');
    });

    it('should update task title', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task Delete',
          projectId: testProject._id,
        });
      testTask = response.body;
    });

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify task is deleted
      const getResponse = await request(app)
        .get(`/api/tasks/project/${testProject._id}`)
        .set('Authorization', `Bearer ${token}`);

      const deletedTask = getResponse.body.find(t => t._id === testTask._id);
      expect(deletedTask).toBeUndefined();
    });
  });
});
