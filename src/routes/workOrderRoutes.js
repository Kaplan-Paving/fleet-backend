// routes/workOrderRoutes.js
import express from 'express';
import {
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    getWorkOrders
} from '../controllers/workOrderController.js';
import { protect } from '../middlewares/auth.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';


const router = express.Router();

router.get('/', protect, getWorkOrders)
router.post('/', protect, createWorkOrder);        // Create
router.put('/:id', protect, updateWorkOrder);      // Update
router.delete('/:id', protect, deleteWorkOrder);   // Delete

export default router;
