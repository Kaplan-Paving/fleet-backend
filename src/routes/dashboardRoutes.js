import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getTopAssetsByRepairs } from '../controllers/dashboardController.js';
import { getTopFuelInefficientUnits } from '../controllers/dashboardController.js';
import { getDashboardNotifications } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/top-assets-by-repairs', getTopAssetsByRepairs);
router.get('/fuel-inefficient', getTopFuelInefficientUnits);
router.get('/notifications', getDashboardNotifications);
export default router;
