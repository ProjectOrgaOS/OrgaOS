/**
 * Model Validation Unit Tests
 *
 * Tests for:
 * - User model validation
 * - Project model validation
 * - Task model validation
 * - Schema defaults
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../../src/models/user.model.js';
import Project from '../../src/models/project.model.js';
import Task from '../../src/models/task.model.js';

describe('Model Validation', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('User Model', () => {
    it('should create a valid user', async () => {
      const user = new User({
        email: 'unit-user@test.com',
        password: 'hashedpassword',
        displayName: 'Unit Test User',
      });

      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require email', async () => {
      const user = new User({
        password: 'hashedpassword',
      });

      const validationError = user.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
    });

    it('should require password', async () => {
      const user = new User({
        email: 'nopassword@test.com',
      });

      const validationError = user.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
    });

    it('should allow optional displayName', async () => {
      const user = new User({
        email: 'nodisplay@test.com',
        password: 'hashedpassword',
      });

      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should initialize empty invitations array', async () => {
      const user = new User({
        email: 'invites@test.com',
        password: 'hashedpassword',
      });

      expect(user.invitations).toBeDefined();
      expect(Array.isArray(user.invitations)).toBe(true);
      expect(user.invitations.length).toBe(0);
    });
  });

  describe('Project Model', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    it('should create a valid project', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'A test project',
        owner: mockUserId,
      });

      const validationError = project.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require name', async () => {
      const project = new Project({
        owner: mockUserId,
      });

      const validationError = project.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
    });

    it('should require owner', async () => {
      const project = new Project({
        name: 'No Owner Project',
      });

      const validationError = project.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.owner).toBeDefined();
    });

    it('should allow optional description', async () => {
      const project = new Project({
        name: 'No Description',
        owner: mockUserId,
      });

      const validationError = project.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should validate member roles', async () => {
      const project = new Project({
        name: 'With Members',
        owner: mockUserId,
        members: [
          { user: mockUserId, role: 'Admin' },
          { user: new mongoose.Types.ObjectId(), role: 'Editor' },
          { user: new mongoose.Types.ObjectId(), role: 'Viewer' },
        ],
      });

      const validationError = project.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should reject invalid member roles', async () => {
      const project = new Project({
        name: 'Invalid Role',
        owner: mockUserId,
        members: [
          { user: mockUserId, role: 'SuperAdmin' }, // Invalid role
        ],
      });

      const validationError = project.validateSync();
      expect(validationError).toBeDefined();
    });

    it('should default member role to Viewer', async () => {
      const project = new Project({
        name: 'Default Role',
        owner: mockUserId,
        members: [
          { user: new mongoose.Types.ObjectId() }, // No role specified
        ],
      });

      expect(project.members[0].role).toBe('Viewer');
    });

    it('should have timestamps', async () => {
      const project = new Project({
        name: 'Timestamp Test',
        owner: mockUserId,
      });

      // Schema has timestamps option
      expect(project.schema.options.timestamps).toBe(true);
    });
  });

  describe('Task Model', () => {
    const mockProjectId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();

    it('should create a valid task', async () => {
      const task = new Task({
        title: 'Test Task',
        description: 'A test task',
        project: mockProjectId,
      });

      const validationError = task.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require title', async () => {
      const task = new Task({
        project: mockProjectId,
      });

      const validationError = task.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
    });

    it('should require project', async () => {
      const task = new Task({
        title: 'No Project Task',
      });

      const validationError = task.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.project).toBeDefined();
    });

    it('should default status to "To Do"', async () => {
      const task = new Task({
        title: 'Default Status',
        project: mockProjectId,
      });

      expect(task.status).toBe('To Do');
    });

    it('should default priority to "Medium"', async () => {
      const task = new Task({
        title: 'Default Priority',
        project: mockProjectId,
      });

      expect(task.priority).toBe('Medium');
    });

    it('should validate status enum', async () => {
      const task = new Task({
        title: 'Invalid Status',
        project: mockProjectId,
        status: 'Invalid',
      });

      const validationError = task.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.status).toBeDefined();
    });

    it('should accept valid status values', async () => {
      const statuses = ['To Do', 'In Progress', 'Done'];

      for (const status of statuses) {
        const task = new Task({
          title: `Status ${status}`,
          project: mockProjectId,
          status,
        });

        const validationError = task.validateSync();
        expect(validationError).toBeUndefined();
      }
    });

    it('should validate priority enum', async () => {
      const task = new Task({
        title: 'Invalid Priority',
        project: mockProjectId,
        priority: 'Critical', // Invalid
      });

      const validationError = task.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.priority).toBeDefined();
    });

    it('should accept valid priority values', async () => {
      const priorities = ['Low', 'Medium', 'High'];

      for (const priority of priorities) {
        const task = new Task({
          title: `Priority ${priority}`,
          project: mockProjectId,
          priority,
        });

        const validationError = task.validateSync();
        expect(validationError).toBeUndefined();
      }
    });

    it('should allow optional assignee', async () => {
      const task = new Task({
        title: 'With Assignee',
        project: mockProjectId,
        assignee: mockUserId,
      });

      const validationError = task.validateSync();
      expect(validationError).toBeUndefined();
      expect(task.assignee.toString()).toBe(mockUserId.toString());
    });

    it('should have timestamps', async () => {
      const task = new Task({
        title: 'Timestamp Test',
        project: mockProjectId,
      });

      expect(task.schema.options.timestamps).toBe(true);
    });
  });
});
