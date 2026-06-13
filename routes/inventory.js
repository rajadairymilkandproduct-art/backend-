import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import Inventory from '../models/Inventory.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * Converts Mongoose ValidationError into a readable 400 AppError
 * so it never reaches the generic 500 handler
 */
const handleMongooseError = (err) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    return new AppError(`Validation failed: ${messages}`, 400);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid value for field "${err.path}": ${err.value}`, 400);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new AppError(`Duplicate value for ${field}`, 400);
  }
  return err; // unknown error — pass through as-is
};

// ─── GET all inventory ────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const inventory = await Inventory.find(filter).sort({ createdAt: -1 });
    const totalValue = inventory.reduce(
      (s, i) => s + i.quantity * (i.price || 0), 0
    );

    res.json({ success: true, count: inventory.length, totalValue, data: inventory });
  } catch (e) {
    next(handleMongooseError(e));
  }
});

// ─── GET analytics summary (must be before /:id) ─────────────────────────────
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const byCategory = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          count:      { $sum: 1 },
          totalQty:   { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
        },
      },
    ]);
    res.json({ success: true, data: byCategory });
  } catch (e) {
    next(handleMongooseError(e));
  }
});

// ─── GET single item ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) throw new AppError('Item not found', 404);
    res.json({ success: true, data: item });
  } catch (e) {
    next(handleMongooseError(e));
  }
});

// ─── POST create item ─────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      item, category, quantity, unit,
      capacity, minStock, price, expiry, location,
    } = req.body;

    // Strict presence check (catches undefined AND empty string)
    if (!item?.trim())          throw new AppError('Item name is required', 400);
    if (quantity  === undefined ||
        quantity  === null      ||
        quantity  === '')       throw new AppError('Quantity is required', 400);
    if (!unit?.trim())          throw new AppError('Unit is required', 400);
    if (capacity  === undefined ||
        capacity  === null      ||
        capacity  === '')       throw new AppError('Capacity is required', 400);
    if (!expiry?.trim())        throw new AppError('Expiry date is required', 400);

    // Validate enum values explicitly to return 400 (not 500)
    const validUnits      = ['L', 'kg', 'pcs'];
    const validCategories = ['Raw Milk', 'Processed Milk', 'Dairy Products', 'Packaging', 'Other'];
    const validLocations  = ['Cold Storage 1', 'Cold Storage 2', 'Dry Storage', 'Processing Unit', 'Other'];

    if (!validUnits.includes(unit)) {
      throw new AppError(`Invalid unit "${unit}". Must be one of: ${validUnits.join(', ')}`, 400);
    }
    if (category && !validCategories.includes(category)) {
      throw new AppError(`Invalid category "${category}". Must be one of: ${validCategories.join(', ')}`, 400);
    }
    if (location && !validLocations.includes(location)) {
      throw new AppError(`Invalid location "${location}". Must be one of: ${validLocations.join(', ')}`, 400);
    }

    // Coerce numeric fields safely
    const numQuantity = Number(quantity);
    const numCapacity = Number(capacity);
    const numMinStock = minStock !== undefined && minStock !== '' ? Number(minStock) : 100;
    const numPrice    = price    !== undefined && price    !== '' ? Number(price)    : 0;

    if (isNaN(numQuantity)) throw new AppError('Quantity must be a number', 400);
    if (isNaN(numCapacity)) throw new AppError('Capacity must be a number', 400);
    if (numQuantity < 0)    throw new AppError('Quantity cannot be negative', 400);
    if (numCapacity < 0)    throw new AppError('Capacity cannot be negative', 400);

    const inv = await Inventory.create({
      item:     item.trim(),
      category: category || 'Raw Milk',
      quantity: numQuantity,
      unit,
      capacity: numCapacity,
      minStock: numMinStock,
      price:    numPrice,
      expiry:   expiry.trim(),
      location: location || 'Cold Storage 1',
      // status is auto-set by the pre-save hook — do NOT send it
    });

    res.status(201).json({ success: true, data: inv });
  } catch (e) {
    next(handleMongooseError(e));
  }
});

// ─── PATCH update item ────────────────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const inv = await Inventory.findById(req.params.id);
    if (!inv) throw new AppError('Item not found', 404);

    const updatable = [
      'item', 'category', 'quantity', 'unit',
      'capacity', 'minStock', 'price', 'expiry', 'location',
    ];

    updatable.forEach((f) => {
      if (req.body[f] !== undefined) {
        // Coerce numeric fields
        if (['quantity', 'capacity', 'minStock', 'price'].includes(f)) {
          inv[f] = Number(req.body[f]);
        } else {
          inv[f] = req.body[f];
        }
      }
    });

    await inv.save(); // triggers pre-save hook to recalculate status
    res.json({ success: true, data: inv });
  } catch (e) {
    next(handleMongooseError(e));
  }
});

// ─── DELETE item ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const inv = await Inventory.findByIdAndDelete(req.params.id);
    if (!inv) throw new AppError('Item not found', 404);
    res.json({ success: true, message: 'Deleted', data: inv });
  } catch (e) {
    next(handleMongooseError(e));
  }
});

export default router;