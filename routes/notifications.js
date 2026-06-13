import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Inventory from '../models/Inventory.js';
import MilkSale from '../models/MilkSale.js';
import Payment from '../models/Payment.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const [lowStock, pendingSales, pendingPayments] = await Promise.all([
      Inventory.find({ status: { $in: ['Low','Critical','Out of Stock'] } }),
      MilkSale.find({ paymentStatus: 'Pending' }).sort({ date: -1 }).limit(5),
      Payment.find({ status: 'Pending' }).sort({ date: -1 }).limit(5),
    ]);

    const notifications = [];

    lowStock.forEach(item => {
      notifications.push({
        type: item.status === 'Out of Stock' ? 'error' : 'warning',
        title: `${item.status}: ${item.item}`,
        message: `Only ${item.quantity} ${item.unit} remaining (min: ${item.minStock})`,
        category: 'inventory',
        ref: item._id,
        createdAt: item.updatedAt,
      });
    });

    pendingSales.forEach(sale => {
      notifications.push({
        type: 'info',
        title: `Pending Payment: ${sale.clientName}`,
        message: `Invoice ${sale.reference} — Rs. ${sale.total}`,
        category: 'sales',
        ref: sale._id,
        createdAt: sale.date,
      });
    });

    pendingPayments.forEach(p => {
      notifications.push({
        type: 'info',
        title: `Distributor Payment Due: ${p.distributorName}`,
        message: `Rs. ${p.amount} pending`,
        category: 'payment',
        ref: p._id,
        createdAt: p.createdAt,
      });
    });

    notifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (e) { next(e); }
});

export default router;
