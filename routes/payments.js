/**
 * Payment Routes - Distributor payments CRUD + mark paid
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllPayments, markPaymentAsPaid } from '../controllers/paymentController.js';
import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/payments - get all with optional ?status=&search=
router.get('/', getAllPayments);

// POST /api/payments - Create a new payment record
router.post('/', async (req, res, next) => {
  try {
    const { distributorId, amount, date, method, reference, notes } = req.body;
    if (!distributorId || !amount || !date || !method)
      throw new AppError('distributorId, amount, date, method required', 400);
    const { default: Distributor } = await import('../models/Distributor.js');
    const dist = await Distributor.findById(distributorId);
    if (!dist) throw new AppError('Distributor not found', 404);
    const payment = await Payment.create({
      distributorId,
      distributorName: dist.name,
      amount: Number(amount),
      date,
      method,
      reference: reference || '-',
      notes: notes || '',
      status: 'Pending',
    });
    res.status(201).json({ success: true, message: 'Payment created', data: payment });
  } catch (e) { next(e); }
});

// PATCH /api/payments/:id/mark-paid
router.patch('/:id/mark-paid', markPaymentAsPaid);

// DELETE /api/payments/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) throw new AppError('Payment not found', 404);
    res.json({ success: true, message: 'Payment deleted', data: payment });
  } catch (e) { next(e); }
});

export default router;
