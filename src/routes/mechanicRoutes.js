import express from 'express';
import { getDailyProductivity } from '../controllers/mechanicController.js';
import { protect } from '../middlewares/auth.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';




const router = express.Router();

// GET /api/mechanics/productivity?userId=...&date=YYYY-MM-DD
router.get('/productivity', protect, getDailyProductivity);

export default router;
