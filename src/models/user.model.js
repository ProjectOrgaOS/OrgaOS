import mongoose from 'mongoose';

// User schema for authentication
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
  // Pending project invitations
  invitations: [{
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    projectName: { type: String },
    inviterName: { type: String },
  }],
});

export default mongoose.model('User', userSchema);
