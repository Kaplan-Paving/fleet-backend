import express from 'express';
import {
    getAlerts,
    acknowledgeAlert,
    commentAlert,
    changeAlertLevel,
    deleteAlert
} from '../controllers/alertController.js';
import { verifyToken } from '../middlewares/auth.js'; // 1. Import your auth middleware

const router = express.Router();

// 2. Apply the middleware to all routes in this file
router.use(verifyToken);

// --- Alert Routes ---
router.get('/', getAlerts);
router.put('/:alertId/acknowledge', acknowledgeAlert);
router.put('/:alertId/comment', commentAlert); // Note: your controller uses :id, route should match
router.put('/:alertId/level', changeAlertLevel);   // Note: your controller uses :id, route should match
router.delete('/:alertId', deleteAlert);         // Note: your controller uses :id, route should match

export default router;