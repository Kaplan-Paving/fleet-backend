import express from 'express';
import { getDailyProductivity } from '../controllers/mechanicController.js';

const router = express.Router();

// GET /api/mechanics/productivity?userId=...&date=YYYY-MM-DD
router.get('/productivity', getDailyProductivity);

export default router;
