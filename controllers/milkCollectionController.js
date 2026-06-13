/**
 * Milk Collection Controller
 * Business logic for milk collection operations including fat-based pricing
 */

import MilkCollection from '../models/MilkCollection.js';
import Distributor from '../models/Distributor.js';
import { calculatePricePerLiter } from '../utils/pricing.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all milk collections with optional date filter and search.
 * Supports query params: ?date=YYYY-MM-DD&search=xxx
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const getAllMilkCollections = async (req, res, next) => {
  try {
    const { date, search } = req.query;

    // Build filter object
    const filter = {};

    if (date && date.trim()) {
      filter.date = date.trim();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.distributorName = searchRegex;
    }

    const collections = await MilkCollection.find(filter)
      .populate('distributorId', 'name village milkType')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new milk collection entry.
 * Automatically calculates pricePerLiter based on fat percentage
 * and computes the total amount.
 *
 * Fat pricing logic:
 *   < 3.5%  → ₹45
 *   3.5–4%  → ₹50
 *   4–5%    → ₹55
 *   5–6%    → ₹60
 *   > 6%    → ₹65
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const addMilkCollection = async (req, res, next) => {
  try {
    const { distributorId, date, shift, quantity, fat, status, cowType } = req.body;

    // Validate required fields
    if (!distributorId || !date || !shift || quantity === undefined || fat === undefined) {
      throw new AppError('distributorId, date, shift, quantity, and fat are required', 400);
    }

    // Validate shift
    if (!['Morning', 'Evening'].includes(shift)) {
      throw new AppError('Shift must be either Morning or Evening', 400);
    }

    // Validate cowType
    if (cowType && !['Cow', 'Buffalo'].includes(cowType)) {
      throw new AppError('Cow type must be either Cow or Buffalo', 400);
    }

    // Validate quantity and fat
    if (quantity < 0) {
      throw new AppError('Quantity cannot be negative', 400);
    }
    if (fat < 0 || fat > 15) {
      throw new AppError('Fat percentage must be between 0 and 15', 400);
    }

    // Find distributor to get name and update totals
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) {
      throw new AppError('Distributor not found', 404);
    }

    // Calculate price per liter based on fat percentage
    const pricePerLiter = calculatePricePerLiter(fat);

    // Calculate total amount
    const total = Math.round(quantity * pricePerLiter);

    // Create the milk collection record
    const milkCollection = await MilkCollection.create({
      distributorId,
      distributorName: distributor.name,
      cowType: cowType || 'Cow',
      date,
      shift,
      quantity,
      fat,
      pricePerLiter,
      total,
      status: status || 'Pending',
    });

    // Update distributor totals
    distributor.totalLiters += quantity;
    distributor.totalAmount += total;
    await distributor.save();

    res.status(201).json({
      success: true,
      data: milkCollection,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAllMilkCollections,
  addMilkCollection,
};
