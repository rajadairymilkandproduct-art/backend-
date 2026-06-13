/**
 * Reports Routes - Download full business reports as PDF
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import MilkCollection from '../models/MilkCollection.js';
import MilkSale from '../models/MilkSale.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import Inventory from '../models/Inventory.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateProfitLossReport, generateInventoryReport } from '../utils/receiptGenerator.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/reports/profit-loss?startDate=&endDate=
router.get('/profit-loss', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end   = endDate   ? new Date(endDate)   : new Date();

    const dateStr = { $gte: start.toISOString().slice(0,10), $lte: end.toISOString().slice(0,10) };

    const [collections, sales, expenses, payments] = await Promise.all([
      MilkCollection.find({ date: dateStr }),
      MilkSale.find({ date: { $gte: start, $lte: end } }),
      Expense.find({ date: dateStr }),
      Payment.find({ status: 'Paid', date: dateStr }),
    ]);

    const milkRevenue  = collections.reduce((s, c) => s + c.total, 0);
    const salesRevenue = sales.reduce((s, c) => s + c.total, 0);
    const totalRevenue = milkRevenue + salesRevenue;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
    const netProfit = totalRevenue - totalExpenses - totalPayments;

    // Group expenses by category
    const expByCategory = {};
    expenses.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });

    const data = {
      startDate: start,
      endDate: end,
      revenue: totalRevenue,
      expenses: totalExpenses + totalPayments,
      netProfit,
      breakdown: {
        revenue: [
          { label: 'Milk Collection Revenue', amount: milkRevenue },
          { label: 'Product Sales Revenue',   amount: salesRevenue },
        ],
        expenses: [
          ...Object.entries(expByCategory).map(([label, amount]) => ({ label, amount })),
          { label: 'Distributor Payments', amount: totalPayments },
        ],
      },
    };

    const pdfBuffer = await generateProfitLossReport(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="profit-loss-report.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) { next(e); }
});

// GET /api/reports/inventory
router.get('/inventory', async (req, res, next) => {
  try {
    const items = await Inventory.find({}).sort({ category: 1, item: 1 });
    const pdfBuffer = await generateInventoryReport(items);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) { next(e); }
});

// GET /api/reports/sales?startDate=&endDate= - JSON summary
router.get('/sales-summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }
    const sales = await MilkSale.find(filter).populate('clientId', 'name city type');
    const totalRevenue  = sales.reduce((s, x) => s + x.total, 0);
    const totalPaid     = sales.filter(x => x.paymentStatus === 'Paid').reduce((s, x) => s + x.total, 0);
    const totalPending  = sales.filter(x => x.paymentStatus === 'Pending').reduce((s, x) => s + x.total, 0);
    res.json({ success: true, data: { totalRevenue, totalPaid, totalPending, count: sales.length, sales } });
  } catch (e) { next(e); }
});

export default router;
