// routes/workOrderRoutes.js
import express from 'express';
import {
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder
} from '../controllers/workOrderController.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

router.post('/', protect, createWorkOrder);        // Create
router.put('/:id', protect, updateWorkOrder);      // Update
router.delete('/:id', protect, deleteWorkOrder);   // Delete

export default router;
