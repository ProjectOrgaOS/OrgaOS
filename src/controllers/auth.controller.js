import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Register a new user
export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password (salt = 10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in database
    const user = await User.create({
      email,
      password: hashedPassword,
      displayName,
    });

    // Return user without password
    res.status(201).json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Login user and return JWT token
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token (expires in 1 day)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return the token
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
