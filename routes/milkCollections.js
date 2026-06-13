import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllMilkCollections, addMilkCollection } from '../controllers/milkCollectionController.js';
import MilkCollection from '../models/MilkCollection.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/',    getAllMilkCollections);
router.post('/',   addMilkCollection);

// DELETE /api/milk-collections/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await MilkCollection.findByIdAndDelete(req.params.id);
    if (!doc) throw new AppError('Collection not found', 404);
    res.json({ success: true, message: 'Deleted', data: doc });
  } catch (e) { next(e); }
});

export default router;
