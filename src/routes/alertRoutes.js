import express from 'express';
import {
    getAlerts,
    acknowledgeAlert,
    commentAlert,
    changeAlertLevel,
    deleteAlert
} from '../controllers/alertController.js';
import { protect } from '../middlewares/auth.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';



const router = express.Router();

// 2. Apply the middleware to all routes in this file
router.use(protect);

// --- Alert Routes ---
router.get('/', protect, getAlerts);
router.put('/:alertId/acknowledge', protect, checkEditPermission('Admin Control'), acknowledgeAlert);
router.put('/:alertId/comment', protect, checkEditPermission('Admin Control'), commentAlert); // Note: your controller uses :id, route should match
router.put('/:alertId/level', protect, checkEditPermission('Admin Control'), changeAlertLevel);   // Note: your controller uses :id, route should match
router.delete('/:alertId', protect, checkEditPermission('Admin Control'), deleteAlert);         // Note: your controller uses :id, route should match

export default router;