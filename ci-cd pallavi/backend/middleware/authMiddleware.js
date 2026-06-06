const jwt = require('jsonwebtoken');

/**
 * @desc    Middleware to protect routes and verify JWT
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header (Format: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // 4. Attach decoded payload (user ID/data) to the request object
      // This allows subsequent middleware/controllers to access the user's info
      req.user = decoded;

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  // 5. If no token is found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };
