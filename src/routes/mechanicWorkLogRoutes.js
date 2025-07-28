// routes/mechanicWorkLogRoutes.js
import express from 'express';
import {
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    getWorkLogs
} from '../controllers/mechanicWorkLogController.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

router.post('/', protect, createWorkLog);
router.get('/', protect, getWorkLogs);             // ?mechanic.userId=...&kaplanUnit=...
router.put('/:id', protect, updateWorkLog);
router.delete('/:id', protect, deleteWorkLog);

export default router;
