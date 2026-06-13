import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllPayments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && ['Paid', 'Pending'].includes(status.trim())) filter.status = status.trim();
    if (search && search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ distributorName: rx }, { reference: rx }];
    }
    const payments = await Payment.find(filter)
      .populate('distributorId', 'name village phone')
      .sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (e) { next(e); }
};

export const markPaymentAsPaid = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.status === 'Paid') throw new AppError('Payment is already marked as paid', 400);
    payment.status = 'Paid';
    payment.paidAt = new Date();
    if (req.body.reference) payment.reference = req.body.reference;
    await payment.save();
    res.status(200).json({ success: true, message: 'Payment marked as paid', data: payment });
  } catch (e) { next(e); }
};

// Backward compat named exports
export { getAllPayments as default };
