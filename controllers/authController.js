/**
 * Auth Controller — Production Level
 * Login · Register · Logout (token blacklist) · Profile · Change Password · User Management
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ─── In-memory token blacklist (use Redis in production for multi-instance) ────
const tokenBlacklist = new Set();

// Periodically clean expired tokens from the blacklist (every 1 hour)
setInterval(() => {
  for (const token of tokenBlacklist) {
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        tokenBlacklist.delete(token); // Remove expired token
      }
    }
  }
}, 60 * 60 * 1000);

export const isTokenBlacklisted = (token) => tokenBlacklist.has(token);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

// ─── Ensure default admin on first start ──────────────────────────────────────
const ensureDefaultAdmin = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create([
      { name: 'Dairy Admin', email: 'admin@dairy.com', password: 'Admin@1234', role: 'Admin' },
    ]);
    console.log('✅ Default admin created: admin@dairy.com / Admin@1234');
  }
};
ensureDefaultAdmin().catch(console.error);

// ─── Register (create account) ────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    if (name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Please provide a valid email address', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new AppError('Password must contain uppercase, lowercase, and a number', 400);
    }

    const allowedRoles = ['Admin', 'Manager', 'Staff'];
    const assignedRole = allowedRoles.includes(role) ? role : 'Staff';

    // Check for existing user
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      throw new AppError('An account with this email already exists', 409);
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      status: 'Active',
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (e) {
    next(e);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'Active') {
      throw new AppError('Your account has been deactivated. Please contact admin.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (e) {
    next(e);
  }
};

// ─── Logout (blacklist token) ─────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        tokenBlacklist.add(token);
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (e) {
    next(e);
  }
};

// ─── Get current user profile ─────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (e) {
    next(e);
  }
};

// ─── Change password ──────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Both current and new password are required', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new AppError('New password must contain uppercase, lowercase, and a number', 400);
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect', 401);

    if (currentPassword === newPassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    user.password = newPassword;
    await user.save();

    // Blacklist current token after password change
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) tokenBlacklist.add(token);
    }

    res.json({ success: true, message: 'Password updated successfully. Please log in again.' });
  } catch (e) {
    next(e);
  }
};

// ─── List all users (Admin / Manager) ────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    if (!['Admin', 'Manager'].includes(req.user.role)) {
      throw new AppError('Access denied. Insufficient permissions.', 403);
    }
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users.map(sanitizeUser) });
  } catch (e) {
    next(e);
  }
};

// ─── Create user (Admin only) ─────────────────────────────────────────────────
export const createUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      throw new AppError('Only administrators can create users', 403);
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new AppError('Password must contain uppercase, lowercase, and a number', 400);
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new AppError('Email already in use', 409);

    const user = await User.create({ name, email: email.toLowerCase(), password, role: role || 'Staff' });
    res.status(201).json({ success: true, data: sanitizeUser(user) });
  } catch (e) {
    next(e);
  }
};

// ─── Update user status (Admin only) ─────────────────────────────────────────
export const updateUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      throw new AppError('Only administrators can update users', 403);
    }
    const { id } = req.params;
    if (id === req.user.id) throw new AppError('Cannot modify your own account here', 400);

    const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (e) {
    next(e);
  }
};
