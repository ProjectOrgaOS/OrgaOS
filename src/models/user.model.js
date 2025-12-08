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
});

export default mongoose.model('User', userSchema);
