import Task from '../models/task.model.js';

// Create a new task
export async function createTask(req, res) {
  try {
    const { title, description, projectId, assignee, priority } = req.body;

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignee,
      priority,
    });

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

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true } // Return the updated document
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Delete a task
export async function deleteTask(req, res) {
  try {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
