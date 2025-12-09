import Project from '../models/project.model.js';

// Create a new project
export async function createProject(req, res) {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    // Create project with owner and add owner to members
    const project = await Project.create({
      name,
      description,
      owner: userId,
      members: [userId],
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get all projects where current user is a member
export async function getMyProjects(req, res) {
  try {
    const userId = req.user.userId;

    // Find projects where user is in members array
    const projects = await Project.find({ members: userId });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
