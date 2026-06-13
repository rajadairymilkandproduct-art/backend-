/**
 * Client Routes - Full CRUD + credit report
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAllClients, getClientById, createClient,
  updateClient, deleteClient, getClientCreditReport,
} from '../controllers/clientController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/',             getAllClients);
router.get('/:id',          getClientById);
router.get('/:id/credit',   getClientCreditReport);
router.post('/',            createClient);
router.patch('/:id',        updateClient);
router.delete('/:id',       deleteClient);

export default router;
