/**
 * Auth Routes — Production Level
 * POST /api/auth/register   — Create new account
 * POST /api/auth/login      — Login
 * POST /api/auth/logout     — Logout (blacklist token)
 * GET  /api/auth/me         — Get current user profile
 * PATCH /api/auth/change-password — Change password
 * GET  /api/auth/users      — List users (Admin/Manager)
 * POST /api/auth/users      — Create user (Admin)
 * PATCH /api/auth/users/:id — Update user status (Admin)
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  getAllUsers,
  createUser,
  updateUser,
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login',    login);

// Protected routes (require valid JWT)
router.post('/logout',           authMiddleware, logout);
router.get('/me',                authMiddleware, getMe);
router.patch('/change-password', authMiddleware, changePassword);

// Admin/Manager routes
router.get('/users',         authMiddleware, getAllUsers);
router.post('/users',        authMiddleware, createUser);
router.patch('/users/:id',   authMiddleware, updateUser);

export default router;
