import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getTopAssetsByRepairs } from '../controllers/dashboardController.js';
import { getTopFuelInefficientUnits } from '../controllers/dashboardController.js';
import { getDashboardNotifications } from '../controllers/dashboardController.js';
import { getUserStats } from '../controllers/dashboardController.js';
import { getFleetLifecycleData } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/user-stats', getUserStats);
router.get('/top-assets-by-repairs', protect, getTopAssetsByRepairs);
router.get('/fuel-inefficient', protect, getTopFuelInefficientUnits);
router.get('/notifications', protect, getDashboardNotifications);
router.get('/fleet-lifecycle', getFleetLifecycleData);
export default router;
