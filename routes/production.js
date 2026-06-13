/**
 * Production Routes - Full CRUD + stats
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Production from '../models/Production.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/production
router.get('/', async (req, res, next) => {
  try {
    const { process, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (process) filter.process = process;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const skip = (page - 1) * limit;
    const [batches, total] = await Promise.all([
      Production.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Production.countDocuments(filter),
    ]);
    res.json({
      success: true,
      count: batches.length,
      total,
      page: +page,
      pages: Math.ceil(total / limit),
      data: batches,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/production/stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Production.aggregate([
      {
        $group: {
          _id: '$process',
          totalBatches: { $sum: 1 },
          totalInput: { $sum: '$inputQuantity' },
          totalOutput: { $sum: '$outputQuantity' },
          totalCost: { $sum: '$totalCost' },
          avgLoss: { $avg: '$lossPercent' },
        },
      },
      { $sort: { totalBatches: -1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (e) {
    next(e);
  }
});

// GET /api/production/:id
router.get('/:id', async (req, res, next) => {
  try {
    const batch = await Production.findById(req.params.id);
    if (!batch) throw new AppError('Production batch not found', 404);
    res.json({ success: true, data: batch });
  } catch (e) {
    next(e);
  }
});

// POST /api/production
router.post('/', async (req, res, next) => {
  try {
    const {
      process,
      inputQty,       // Frontend sends this
      inputQuantity,   // Or backend might send this
      inputUnit,
      inputPrice,      // ADDED: Missing price field
      outputQty,       // Frontend sends this
      outputQuantity,  // Or backend might send this
      outputUnit,
      outputPrice,     // ADDED: Missing price field
      laborCost,
      energyCost,
      date,
      notes,
      status,
    } = req.body;

    // Debug logging
    console.log('📝 POST /api/production received:', {
      inputQty, outputQty, inputQuantity, outputQuantity, process, date
    });

    // Normalize field names (accept both frontend and backend naming)
    const finalInputQty = inputQty || inputQuantity;
    const finalOutputQty = outputQty || outputQuantity;

    console.log('✅ Normalized:', { finalInputQty, finalOutputQty });

    if (!process || !finalInputQty || !finalOutputQty) {
      throw new AppError('process, inputQuantity, outputQuantity required', 400);
    }

    const batch = await Production.create({
      process,
      inputQuantity: finalInputQty,
      inputUnit: inputUnit || 'L',
      inputPrice: inputPrice || 0,       // ADDED
      outputQuantity: finalOutputQty,
      outputUnit: outputUnit || 'L',
      outputPrice: outputPrice || 0,      // ADDED
      laborCost: laborCost || 0,
      energyCost: energyCost || 0,
      date: date || new Date(),
      notes,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Production batch created',
      data: batch,
    });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/production/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const batch = await Production.findById(req.params.id);
    if (!batch) throw new AppError('Production batch not found', 404);

    // Map frontend field names to backend field names
    if (req.body.inputQty !== undefined) batch.inputQuantity = req.body.inputQty;
    if (req.body.outputQty !== undefined) batch.outputQuantity = req.body.outputQty;
    if (req.body.inputPrice !== undefined) batch.inputPrice = req.body.inputPrice;
    if (req.body.outputPrice !== undefined) batch.outputPrice = req.body.outputPrice;

    // Standard fields
    const fields = [
      'process',
      'inputQuantity',
      'inputUnit',
      'inputPrice',    // ADDED
      'outputQuantity',
      'outputUnit',
      'outputPrice',   // ADDED
      'laborCost',
      'energyCost',
      'date',
      'notes',
      'status',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) batch[f] = req.body[f];
    });

    await batch.save(); // pre-save hook in model recalculates lossPercent & totalCost
    res.json({ success: true, message: 'Updated', data: batch });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/production/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const batch = await Production.findByIdAndDelete(req.params.id);
    if (!batch) throw new AppError('Production batch not found', 404);
    res.json({ success: true, message: 'Deleted', data: batch });
  } catch (e) {
    next(e);
  }
});

export default router;