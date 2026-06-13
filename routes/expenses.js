/**
 * Expenses Routes - Full CRUD
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (startDate || endDate) { filter.date = {}; if (startDate) filter.date.$gte = startDate; if (endDate) filter.date.$lte = endDate; }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ success: true, count: expenses.length, total, data: expenses });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { category, amount, date, note } = req.body;
    if (!category || !amount || !date) throw new AppError('category, amount, date required', 400);
    const expense = await Expense.create({ category, amount, date, note: note || '' });
    res.status(201).json({ success: true, message: 'Expense recorded', data: expense });
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) throw new AppError('Expense not found', 404);
    ['category','amount','date','note'].forEach(f => { if (req.body[f] !== undefined) expense[f] = req.body[f]; });
    await expense.save();
    res.json({ success: true, data: expense });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) throw new AppError('Expense not found', 404);
    res.json({ success: true, message: 'Deleted', data: expense });
  } catch (e) { next(e); }
});

export default router;
