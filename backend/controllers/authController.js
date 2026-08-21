const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

// Helper: SHA-256 Hashing for OTP
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// 1. POST /api/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Field validations
    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists in PostgreSQL
    const existingUserResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered. Please log in.' });
    }

    // Hash password with bcrypt (10 salt rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user in PostgreSQL
    const insertResult = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), cleanEmail, hashedPassword]
    );

    const newUser = insertResult.rows[0];

    // Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);

    // Generate short-lived OTP JWT (5 minutes)
    const otpToken = jwt.sign(
      {
        tokenType: 'otp',
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        otpHash: otpHash
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '5m' }
    );

    // Return response with temporary OTP (for local development testing)
    return res.status(201).json({
      message: 'Account created successfully. OTP generated for verification.',
      otpToken: otpToken,
      otp: otp // Temporarily returned for local dev/testing
    });

  } catch (error) {
    console.error('Error in signup:', error);
    return res.status(500).json({ message: 'Internal server error during signup.' });
  }
};

// 2. POST /api/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, otpToken } = req.body;

    if (!email || !otp || !otpToken) {
      return res.status(400).json({ message: 'Email, OTP, and OTP token are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET || 'fallback_jwt_secret');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'OTP has expired (5-minute limit). Please sign up again.' });
      }
      return res.status(401).json({ message: 'Invalid or corrupted OTP token.' });
    }

    // Verify token payload structure
    if (decoded.tokenType !== 'otp') {
      return res.status(400).json({ message: 'Invalid token type. OTP token expected.' });
    }

    if (decoded.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(400).json({ message: 'Email does not match OTP token session.' });
    }

    // Hash provided OTP and compare with stored hash
    const submittedOtpHash = hashOtp(otp.trim());
    if (submittedOtpHash !== decoded.otpHash) {
      return res.status(400).json({ message: 'Incorrect OTP entered. Please try again.' });
    }

    // Generate Session JWT (1 hour expiration)
    const sessionToken = jwt.sign(
      {
        tokenType: 'session',
        userId: decoded.userId,
        email: decoded.email
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'OTP verified successfully!',
      token: sessionToken,
      user: {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email
      }
    });

  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({ message: 'Internal server error during OTP verification.' });
  }
};

// 3. POST /api/login (NO OTP REQUIREMENT)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user in PostgreSQL
    const userResult = await pool.query(
      'SELECT id, name, email, password FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (userResult.rows.length === 0) {
      // Use generic auth error for security
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate Session JWT directly (NO OTP GENERATION)
    const sessionToken = jwt.sign(
      {
        tokenType: 'session',
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

// 4. GET /api/profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      message: 'User profile retrieved successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};

module.exports = {
  signup,
  verifyOtp,
  login,
  getProfile
};
