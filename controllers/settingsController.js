/**
 * Settings Controller
 * Manages business settings, production level, and password changes
 */

import User from '../models/User.js';
import BusinessSettings from '../models/BusinessSettings.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get business settings
 */
export const getBusinessSettings = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne().populate('updatedBy', 'name email');
    
    if (!settings) {
      // Create default settings if they don't exist
      settings = await BusinessSettings.create({
        businessName: 'Shri Ram Dairy',
        ownerName: 'Mohan Lal',
        phone: '9876543210',
        email: 'admin@shriram.dairy',
        address: 'Village Road, Sundarpur, UP - 226001',
        productionLevel: {
          name: 'Starter',
          maxDailyLitres: 100,
          maxDistributors: 10,
          maxClients: 20,
          features: ['Basic Analytics', 'Single User', 'Email Support']
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update business settings
 */
export const updateBusinessSettings = async (req, res, next) => {
  try {
    const { businessName, ownerName, phone, email, address, gstNumber, bankAccount, timezone } = req.body;
    
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      settings = new BusinessSettings();
    }
    
    // Update fields
    if (businessName) settings.businessName = businessName;
    if (ownerName) settings.ownerName = ownerName;
    if (phone) settings.phone = phone;
    if (email) settings.email = email.toLowerCase();
    if (address) settings.address = address;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (bankAccount !== undefined) settings.bankAccount = bankAccount;
    if (timezone) settings.timezone = timezone;
    
    settings.updatedBy = req.user.id;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Business settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update production level
 */
export const updateProductionLevel = async (req, res, next) => {
  try {
    const { name, maxDailyLitres, maxDistributors, maxClients } = req.body;
    
    const validLevels = ['Starter', 'Growing', 'Established', 'Enterprise'];
    if (!validLevels.includes(name)) {
      throw new AppError('Invalid production level', 400);
    }
    
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      settings = new BusinessSettings();
    }
    
    // Define level features
    const levelFeatures = {
      'Starter': ['Basic Analytics', 'Single User', 'Email Support'],
      'Growing': ['Advanced Analytics', 'Multiple Users (5)', 'SMS Notifications', 'Priority Support'],
      'Established': ['Full Analytics', 'Multiple Users (20)', 'SMS + Email', 'API Access', 'Phone Support'],
      'Enterprise': ['Custom Analytics', 'Unlimited Users', 'All Features', 'Dedicated Account Manager', '24/7 Support']
    };
    
    settings.productionLevel = {
      name,
      maxDailyLitres: maxDailyLitres || settings.productionLevel.maxDailyLitres,
      maxDistributors: maxDistributors || settings.productionLevel.maxDistributors,
      maxClients: maxClients || settings.productionLevel.maxClients,
      features: levelFeatures[name]
    };
    
    settings.updatedBy = req.user.id;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Production level updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError('Current password, new password, and confirm password are required', 400);
    }
    
    if (newPassword !== confirmPassword) {
      throw new AppError('New passwords do not match', 400);
    }
    
    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }
    
    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
