/**
 * Distributor Controller
 * Business logic for distributor CRUD operations
 */

import Distributor from '../models/Distributor.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all distributors with optional search and village filter.
 * Supports query params: ?search=xxx&village=xxx
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const getAllDistributors = async (req, res, next) => {
  try {
    const { search, village } = req.query;

    // Build filter object
    const filter = {};

    if (village && village.trim()) {
      filter.village = village.trim();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { village: searchRegex },
        { phone: searchRegex },
      ];
    }

    const distributors = await Distributor.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: distributors.length,
      data: distributors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single distributor by ID
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const getDistributorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const distributor = await Distributor.findById(id);

    if (!distributor) {
      throw new AppError('Distributor not found', 404);
    }

    res.status(200).json({
      success: true,
      data: distributor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new distributor
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const createDistributor = async (req, res, next) => {
  try {
    const { name, village, phone, address, aadhaar, bank, accountNumber, ifscCode, bankName, milkType, joiningDate, joinDate, status } = req.body;

    // Validate required fields
    if (!name || !village || !phone || !milkType) {
      throw new AppError('Name, village, phone, and milkType are required', 400);
    }

    const distributor = await Distributor.create({
      name,
      village,
      phone,
      address: address || '',
      aadhaar: aadhaar || '',
      bank: bank || '',
      accountNumber: accountNumber || '',
      ifscCode: ifscCode || '',
      bankName: bankName || '',
      milkType,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      status: status || 'Active',
      totalLiters: req.body.totalLiters || 0,
      totalAmount: req.body.totalAmount || 0,
    });

    res.status(201).json({
      success: true,
      data: distributor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a distributor by ID
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const deleteDistributor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const distributor = await Distributor.findByIdAndDelete(id);

    if (!distributor) {
      throw new AppError('Distributor not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Distributor deleted successfully',
      data: distributor,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAllDistributors,
  getDistributorById,
  createDistributor,
  deleteDistributor,
};
