import express from 'express';
import {
    createThreshold,
    getAllThresholds,
    updateThreshold,
    deleteThreshold
} from '../controllers/maintenanceThresholdController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

// Only Admin can create/update/delete
router.post('/', protect, checkPermission('admin'), createThreshold);
router.put('/:id', protect, checkPermission('admin'), updateThreshold);
router.delete('/:id', protect, checkPermission('admin'), deleteThreshold);

// Anyone authenticated can view
router.get('/', getAllThresholds);

export default router;
