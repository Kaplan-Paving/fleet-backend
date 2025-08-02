import express from 'express';
import {
    createWorkLog,
    getWorkLogsForOrder,
    updateWorkLog,
    deleteWorkLog
} from '../controllers/mechanicWorkLogController.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';
import { protect } from '../middlewares/auth.js';
// import { verifyToken } from '../middlewares/auth.js'; // Assuming you have auth middleware

const router = express.Router();

// Apply authentication middleware to all routes in this file
// router.use(verifyToken);

// --- Mechanic Work Log Routes ---

// @route   POST /api/worklogs
// @desc    Create a new work log for a work order
router.post('/', protect, createWorkLog);

// @route   GET /api/worklogs/:workOrderId
// @desc    Get all work logs associated with a specific work order
router.get('/:workOrderId', protect, getWorkLogsForOrder);

// @route   PUT /api/worklogs/:logId
// @desc    Update a specific work log
router.put('/:logId', protect, updateWorkLog);

// @route   DELETE /api/worklogs/:logId
// @desc    Delete a specific work log
router.delete('/:logId', protect, deleteWorkLog);

export default router;
