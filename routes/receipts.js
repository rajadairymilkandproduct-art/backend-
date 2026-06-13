/**
 * Receipt Routes - Download PDF receipts for sales, payments, collections
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import MilkSale from '../models/MilkSale.js';
import Payment from '../models/Payment.js';
import MilkCollection from '../models/MilkCollection.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  generateSaleReceipt,
  generatePaymentReceipt,
  generateCollectionReceipt,
} from '../utils/receiptGenerator.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/receipts/sale/:id  → Download sale invoice PDF
router.get('/sale/:id', async (req, res, next) => {
  try {
    const sale = await MilkSale.findById(req.params.id).populate('clientId', 'name phone city');
    if (!sale) throw new AppError('Sale not found', 404);
    const pdfBuffer = await generateSaleReceipt(sale);
    const filename = `invoice-${sale.reference || sale._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) { next(e); }
});

// GET /api/receipts/payment/:id  → Download payment receipt PDF
router.get('/payment/:id', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('distributorId', 'name phone village');
    if (!payment) throw new AppError('Payment not found', 404);
    const pdfBuffer = await generatePaymentReceipt(payment);
    const filename = `payment-receipt-${payment._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) { next(e); }
});

// GET /api/receipts/collection/:id  → Download milk collection receipt PDF
router.get('/collection/:id', async (req, res, next) => {
  try {
    const collection = await MilkCollection.findById(req.params.id).populate('distributorId', 'name phone village');
    if (!collection) throw new AppError('Collection not found', 404);
    const pdfBuffer = await generateCollectionReceipt(collection);
    const filename = `collection-${collection._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) { next(e); }
});

export default router;
