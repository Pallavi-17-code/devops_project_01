const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const log = require('../utils/logger');

// ─── Helper: Generate JWT Token ──────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // 1. Validate fields
    if (!username || !email || !password) {
      log.warn('Registration Rejected: Missing parameters');
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    // 2. Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      log.warn(`Registration Rejected: User ${email} already exists`);
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user in database
    const newUser = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const user = newUser.rows[0];
    log.success(`New Matrix User Created: ${username}`);

    // 5. Send response
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user.id),
      },
    });
  } catch (error) {
    log.error(`Registration Fault: ${error.message}`);
    next(error); // Pass error to global error handler
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Validate fields
    if (!email || !password) {
      log.warn('Auth Handshake Failed: Incomplete credentials payload');
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // 2. Find user by email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      log.warn(`Auth Handshake Failed: Unrecognized identity ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      log.warn(`Auth Handshake Failed: Incorrect cryptographic key for ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    log.success(`Root Authority Authenticated: ${user.username}`);

    // 4. Send response with token
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user.id),
      },
    });
  } catch (error) {
    log.error(`Authentication Fault: ${error.message}`);
    next(error);
  }
};
