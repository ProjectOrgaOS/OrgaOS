import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import Task from '../models/task.model.js';

// Create a new project
export async function createProject(req, res) {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    // Create project with owner as Admin member
    const project = await Project.create({
      name,
      description,
      owner: userId,
      members: [{ user: userId, role: 'Admin' }],
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

    // Find projects where user is in members array (new structure)
    const projects = await Project.find({ 'members.user': userId });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Send invitation to a user
export async function sendInvite(req, res) {
  try {
    const { id: projectId } = req.params;
    const { email } = req.body;
    const inviterId = req.user.userId;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if requester is the owner
    if (project.owner.toString() !== inviterId) {
      return res.status(403).json({ message: 'Only project owner can invite members' });
    }

    // Find user to invite
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member (new structure)
    const isMember = project.members.some(
      m => m.user.toString() === userToInvite._id.toString()
    );
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if already invited
    const alreadyInvited = userToInvite.invitations.some(
      inv => inv.projectId.toString() === projectId
    );
    if (alreadyInvited) {
      return res.status(400).json({ message: 'User already has a pending invitation' });
    }

    // Get inviter name
    const inviter = await User.findById(inviterId);

    // Add invitation using $push (atomic)
    const invitation = {
      projectId: project._id,
      projectName: project.name,
      inviterName: inviter.displayName || inviter.email,
    };

    await User.findByIdAndUpdate(userToInvite._id, {
      $push: { invitations: invitation },
    });

    // Emit socket event to the invited user
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const targetSocketId = userSockets.get(userToInvite._id.toString());

    if (targetSocketId) {
      io.to(targetSocketId).emit('newInvitation', invitation);
    }

    res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get project members with their roles
export async function getProjectMembers(req, res) {
  try {
    const { id: projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('members.user', 'displayName email')
      .populate('owner', 'displayName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Format response with owner flag
    const members = project.members.map(m => ({
      _id: m.user._id,
      displayName: m.user.displayName,
      email: m.user.email,
      role: m.role,
      isOwner: m.user._id.toString() === project.owner._id.toString(),
    }));

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update a member's role (Admin only)
export async function updateMemberRole(req, res) {
  try {
    const { id: projectId, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.userId;

    // Validate role
    if (!['Admin', 'Editor', 'Viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if requester is Admin
    const requesterMember = project.members.find(
      m => m.user.toString() === requesterId
    );
    if (!requesterMember || requesterMember.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can change roles' });
    }

    // Cannot change owner's role
    if (project.owner.toString() === targetUserId) {
      return res.status(403).json({ message: 'Cannot change project owner role' });
    }

    // Update member role
    const memberIndex = project.members.findIndex(
      m => m.user.toString() === targetUserId
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    project.members[memberIndex].role = role;
    await project.save();

    // Emit socket event to all project members
    const io = req.app.get('io');
    io.to(`project:${projectId}`).emit('memberRoleUpdated', {
      projectId,
      userId: targetUserId,
      newRole: role,
    });

    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Remove a member from project (Admin only)
export async function removeMember(req, res) {
  try {
    const { id: projectId, userId: targetUserId } = req.params;
    const requesterId = req.user.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if requester is Admin
    const requesterMember = project.members.find(
      m => m.user.toString() === requesterId
    );
    if (!requesterMember || requesterMember.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can remove members' });
    }

    // Cannot remove the owner
    if (project.owner.toString() === targetUserId) {
      return res.status(403).json({ message: 'Cannot remove project owner' });
    }

    // Check if target is a member
    const memberIndex = project.members.findIndex(
      m => m.user.toString() === targetUserId
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Remove member
    project.members.splice(memberIndex, 1);
    await project.save();

    // Emit socket event to notify all project members
    const io = req.app.get('io');
    io.to(`project:${projectId}`).emit('memberRemoved', {
      projectId,
      userId: targetUserId,
    });

    // Also notify the removed user directly
    const userSockets = req.app.get('userSockets');
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('removedFromProject', { projectId });
    }

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Delete a project (Admin only)
export async function deleteProject(req, res) {
  try {
    const { id: projectId } = req.params;
    const requesterId = req.user.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if requester is Admin
    const requesterMember = project.members.find(
      m => m.user.toString() === requesterId
    );
    if (!requesterMember || requesterMember.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can delete projects' });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: projectId });

    // Emit socket event before deleting to notify all members
    const io = req.app.get('io');
    io.to(`project:${projectId}`).emit('projectDeleted', { projectId });

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
