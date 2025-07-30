import express from 'express';
import {
    createThreshold,
    getThresholds,
    updateThresholds,

} from '../controllers/maintenanceThresholdController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

// Only Admin can create/update/delete
router.post('/', createThreshold);
router.put('/:id', updateThresholds);


// Anyone authenticated can view
router.get('/', getThresholds);

export default router;
