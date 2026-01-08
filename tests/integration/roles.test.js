/**
 * Role-Based Access Control Integration Tests
 *
 * Tests for:
 * - Admin permissions
 * - Editor permissions
 * - Viewer permissions
 * - Member management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';
import Project from '../../src/models/project.model.js';
import Task from '../../src/models/task.model.js';

describe('Role-Based Access Control', () => {
  let adminToken, editorToken, viewerToken;
  let adminUser, editorUser, viewerUser;
  let testProject;

  const adminEmail = 'rbac-admin@test.com';
  const editorEmail = 'rbac-editor@test.com';
  const viewerEmail = 'rbac-viewer@test.com';

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Clean up
    await User.deleteMany({ email: { $in: [adminEmail, editorEmail, viewerEmail] } });
    await Project.deleteMany({ name: 'RBAC Test Project' });

    // Create admin user and login
    await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password: 'password123',
      displayName: 'Admin User',
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'password123',
    });
    adminToken = adminLogin.body.token;
    adminUser = await User.findOne({ email: adminEmail });

    // Create editor user
    await request(app).post('/api/auth/register').send({
      email: editorEmail,
      password: 'password123',
      displayName: 'Editor User',
    });
    const editorLogin = await request(app).post('/api/auth/login').send({
      email: editorEmail,
      password: 'password123',
    });
    editorToken = editorLogin.body.token;
    editorUser = await User.findOne({ email: editorEmail });

    // Create viewer user
    await request(app).post('/api/auth/register').send({
      email: viewerEmail,
      password: 'password123',
      displayName: 'Viewer User',
    });
    const viewerLogin = await request(app).post('/api/auth/login').send({
      email: viewerEmail,
      password: 'password123',
    });
    viewerToken = viewerLogin.body.token;
    viewerUser = await User.findOne({ email: viewerEmail });

    // Admin creates a project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'RBAC Test Project',
        description: 'Testing role-based access control',
      });
    testProject = projectRes.body;

    // Add editor and viewer as members using $each for multiple items
    await Project.findByIdAndUpdate(testProject._id, {
      $push: {
        members: {
          $each: [
            { user: editorUser._id, role: 'Editor' },
            { user: viewerUser._id, role: 'Viewer' },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await Task.deleteMany({ project: testProject?._id });
    await Project.deleteMany({ name: 'RBAC Test Project' });
    await User.deleteMany({ email: { $in: [adminEmail, editorEmail, viewerEmail] } });
    await mongoose.connection.close();
  });

  describe('Admin Permissions', () => {
    it('admin can create tasks', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Task',
          projectId: testProject._id,
        });

      expect(response.status).toBe(201);
    });

    it('admin can update member roles', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProject._id}/members/${editorUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'Editor' });

      expect(response.status).toBe(200);
    });

    it('admin can invite members', async () => {
      // Create a new user to invite
      await request(app).post('/api/auth/register').send({
        email: 'rbac-invite@test.com',
        password: 'password123',
        displayName: 'Invite User',
      });

      const response = await request(app)
        .post(`/api/projects/${testProject._id}/invite`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'rbac-invite@test.com' });

      expect(response.status).toBe(200);

      // Cleanup
      await User.deleteOne({ email: 'rbac-invite@test.com' });
    });

    it('admin can view project members', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/members`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Editor Permissions', () => {
    it('editor can view project', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(response.status).toBe(200);
      const project = response.body.find(p => p._id === testProject._id);
      expect(project).toBeDefined();
    });

    it('editor can create tasks', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Editor Task',
          projectId: testProject._id,
        });

      expect(response.status).toBe(201);
    });

    it('editor cannot invite members', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/invite`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ email: 'someone@test.com' });

      expect(response.status).toBe(403);
    });

    it('editor cannot change member roles', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProject._id}/members/${viewerUser._id}/role`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ role: 'Admin' });

      expect(response.status).toBe(403);
    });
  });

  describe('Viewer Permissions', () => {
    it('viewer can view project', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
    });

    it('viewer can view tasks', async () => {
      const response = await request(app)
        .get(`/api/tasks/project/${testProject._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
    });

    it('viewer cannot create tasks', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Task',
          projectId: testProject._id,
        });

      // Should be 403 Forbidden
      expect(response.status).toBe(403);
    });

    it('viewer cannot delete tasks', async () => {
      // First create a task as admin
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Task to Delete',
          projectId: testProject._id,
        });

      const response = await request(app)
        .delete(`/api/tasks/${taskRes.body._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });

    it('viewer cannot invite members', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/invite`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ email: 'someone@test.com' });

      expect(response.status).toBe(403);
    });
  });

  describe('Member Management', () => {
    it('admin can remove members', async () => {
      // Create a user to remove
      await request(app).post('/api/auth/register').send({
        email: 'rbac-remove@test.com',
        password: 'password123',
        displayName: 'Remove User',
      });
      const removeUser = await User.findOne({ email: 'rbac-remove@test.com' });

      // Add to project
      await Project.findByIdAndUpdate(testProject._id, {
        $push: { members: { user: removeUser._id, role: 'Viewer' } },
      });

      // Remove the member
      const response = await request(app)
        .delete(`/api/projects/${testProject._id}/members/${removeUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Cleanup
      await User.deleteOne({ email: 'rbac-remove@test.com' });
    });

    it('admin cannot remove project owner', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject._id}/members/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });

    it('editor cannot remove members', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject._id}/members/${viewerUser._id}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
