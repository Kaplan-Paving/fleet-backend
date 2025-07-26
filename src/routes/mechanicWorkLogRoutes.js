// routes/mechanicWorkLogRoutes.js
import express from 'express';
import {
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    getWorkLogs
} from '../controllers/mechanicWorkLogController.js';

const router = express.Router();

router.post('/', createWorkLog);
router.get('/', getWorkLogs);             // ?mechanic.userId=...&kaplanUnit=...
router.put('/:id', updateWorkLog);
router.delete('/:id', deleteWorkLog);

export default router;
