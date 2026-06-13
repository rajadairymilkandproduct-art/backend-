/**
 * Settings Routes
 */
import express from 'express';
import { authMiddleware, roleGuard } from '../middleware/auth.js';
import {
  getBusinessSettings,
  updateBusinessSettings,
  updateProductionLevel,
  getUserProfile,
  changePassword
} from '../controllers/settingsController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get business settings (accessible to all authenticated users)
router.get('/business', getBusinessSettings);

// Update business settings (Admin/Manager only)
router.patch('/business', roleGuard('Admin', 'Manager'), updateBusinessSettings);

// Update production level (Admin only)
router.patch('/production-level', roleGuard('Admin'), updateProductionLevel);

// Get current user profile
router.get('/profile', getUserProfile);

// Change password
router.patch('/change-password', changePassword);

export default router;
