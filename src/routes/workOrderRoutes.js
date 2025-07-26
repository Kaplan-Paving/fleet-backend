// routes/workOrderRoutes.js
import express from 'express';
import {
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder
} from '../controllers/workOrderController.js';

const router = express.Router();

router.post('/', createWorkOrder);        // Create
router.put('/:id', updateWorkOrder);      // Update
router.delete('/:id', deleteWorkOrder);   // Delete

export default router;
