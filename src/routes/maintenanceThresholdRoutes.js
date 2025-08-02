import express from 'express';
import {
    createThreshold,
    getThresholds,
    updateThresholds,

} from '../controllers/maintenanceThresholdController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { protect } from '../middlewares/auth.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';


const router = express.Router();

// Only Admin can create/update/delete
router.post('/', protect, checkEditPermission('Maintenance'), createThreshold);
router.put('/:id', protect, checkEditPermission('Maintenance'), updateThresholds);


// Anyone authenticated can view
router.get('/', protect, getThresholds);

export default router;

