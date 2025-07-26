import express from 'express';
import {
    createThreshold,
    getAllThresholds,
    updateThreshold,
    deleteThreshold
} from '../controllers/maintenanceThresholdController.js';
import { checkPermission } from '../middlewares/checkPermission.js';

const router = express.Router();

// Only Admin can create/update/delete
router.post('/', checkPermission('admin'), createThreshold);
router.put('/:id', checkPermission('admin'), updateThreshold);
router.delete('/:id', checkPermission('admin'), deleteThreshold);

// Anyone authenticated can view
router.get('/', getAllThresholds);

export default router;
