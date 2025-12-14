import Task from '../models/task.model.js';
import Project from '../models/project.model.js';

// Helper: Check if user can edit (Admin or Editor)
async function canEdit(userId, projectId) {
  const project = await Project.findById(projectId);
  if (!project) return false;
  const member = project.members.find(m => m.user.toString() === userId);
  return member && (member.role === 'Admin' || member.role === 'Editor');
}

// Create a new task
export async function createTask(req, res) {
  try {
    const { title, description, projectId, assignee, priority } = req.body;
    const userId = req.user.userId;

    // Check if user can edit
    if (!(await canEdit(userId, projectId))) {
      return res.status(403).json({ message: 'Viewers cannot create tasks' });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignee,
      priority,
    });

    // Broadcast to all clients (frontend filters by project)
    req.app.get('io').emit('taskCreated', task);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get all tasks for a specific project
export async function getTasksByProject(req, res) {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'displayName email');

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update task status (for moving between columns)
export async function updateTaskStatus(req, res) {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    // Get task to check project
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can edit
    if (!(await canEdit(userId, existingTask.project))) {
      return res.status(403).json({ message: 'Viewers cannot move tasks' });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true } // Return the updated document
    );

    // Broadcast status change to all clients
    req.app.get('io').emit('taskUpdated', task);

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update task (priority, title, description, etc.)
export async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    // Get task to check project
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can edit
    if (!(await canEdit(userId, existingTask.project))) {
      return res.status(403).json({ message: 'Viewers cannot edit tasks' });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      updates,
      { new: true }
    );

    // Broadcast update to all clients
    req.app.get('io').emit('taskUpdated', task);

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Delete a task
export async function deleteTask(req, res) {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;

    // Get task to check project
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can edit
    if (!(await canEdit(userId, existingTask.project))) {
      return res.status(403).json({ message: 'Viewers cannot delete tasks' });
    }

    const task = await Task.findByIdAndDelete(taskId);

    // Broadcast deletion to all clients
    req.app.get('io').emit('taskDeleted', { taskId, project: task.project });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
