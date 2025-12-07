import mongoose from 'mongoose';

// Connect to MongoDB using Mongoose
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

// Close the connection (useful for cleanup)
export async function closeDB() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}
