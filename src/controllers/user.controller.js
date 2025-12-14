import User from '../models/user.model.js';
import Project from '../models/project.model.js';

// Get current user's invitations
export async function getMyInvitations(req, res) {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('invitations');
    res.status(200).json(user.invitations || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Accept or decline an invitation
export async function respondToInvite(req, res) {
  try {
    const { projectId, accept } = req.body;
    const userId = req.user.userId;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if invitation exists
    const invitation = user.invitations.find(
      inv => inv.projectId.toString() === projectId
    );
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // If accepted, add user to project members with default Viewer role
    if (accept) {
      await Project.findByIdAndUpdate(projectId, {
        $push: { members: { user: userId, role: 'Viewer' } },
      });
    }

    // Always remove the invitation using $pull (atomic)
    await User.findByIdAndUpdate(userId, {
      $pull: { invitations: { projectId: projectId } },
    });

    const message = accept ? 'Invitation accepted' : 'Invitation declined';
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
