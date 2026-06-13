/**
 * Sales Routes - Full CRUD + reports
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAllSales, getSaleById, createSale,
  markSaleAsPaid, getSalesByClient,
  getSalesByProduct, deleteSale,
} from '../controllers/salesController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/',             getAllSales);
router.get('/by-client',    getSalesByClient);
router.get('/by-product',   getSalesByProduct);
router.get('/:id',          getSaleById);
router.post('/',            createSale);
router.patch('/:id/pay',    markSaleAsPaid);
router.delete('/:id',       deleteSale);

export default router;
