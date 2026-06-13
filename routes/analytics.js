import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDashboardStats, getMonthlyData, getDailyData, getProfitLoss } from '../controllers/analyticsController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/dashboard',    getDashboardStats);
router.get('/monthly',      getMonthlyData);
router.get('/daily',        getDailyData);
router.get('/profit-loss',  getProfitLoss);

export default router;
