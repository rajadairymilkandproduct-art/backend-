import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllDistributors, getDistributorById, createDistributor, deleteDistributor } from '../controllers/distributorController.js';
import Distributor from '../models/Distributor.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/',     getAllDistributors);
router.get('/:id',  getDistributorById);
router.post('/',    createDistributor);

// PATCH update distributor
router.patch('/:id', async (req, res, next) => {
  try {
    const dist = await Distributor.findById(req.params.id);
    if (!dist) throw new AppError('Distributor not found', 404);
    ['name','village','phone','address','aadhaar','bank','accountNumber','ifscCode','bankName','milkType','status','joiningDate'].forEach(f => {
      if (req.body[f] !== undefined) dist[f] = req.body[f];
    });
    await dist.save();
    res.json({ success: true, data: dist });
  } catch (e) { next(e); }
});

router.delete('/:id', deleteDistributor);

export default router;
