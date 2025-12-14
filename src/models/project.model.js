import mongoose from 'mongoose';

// Project schema for project management
// Roles: Admin (full control), Editor (can modify tasks), Viewer (read-only)
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Admin', 'Editor', 'Viewer'], default: 'Viewer' },
  }],
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
