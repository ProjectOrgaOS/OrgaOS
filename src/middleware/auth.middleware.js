import jwt from 'jsonwebtoken';

// Middleware to protect private routes
export function authMiddleware(req, res, next) {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  // Check if header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract the token (remove 'Bearer ' prefix)
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object
    req.user = decoded;

    // Continue to the next middleware/route
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}
