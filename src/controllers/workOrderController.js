// controllers/workOrderController.js
import WorkOrder from '../models/WorkOrder.js';
import mongoose from 'mongoose';

// 📌 Create Work Order
export const createWorkOrder = async (req, res) => {
    try {
        const data = req.body;

        const newOrder = await WorkOrder.create(data);
        return res.status(201).json({ message: 'Work order created', workOrder: newOrder });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating work order' });
    }
};

// 📌 Update Work Order
export const updateWorkOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ error: 'Invalid WorkOrder ID' });

    try {
        const updatedOrder = await WorkOrder.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedOrder) return res.status(404).json({ error: 'Work order not found' });

        res.json({ message: 'Work order updated', workOrder: updatedOrder });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating work order' });
    }
};

// 📌 Delete Work Order
export const deleteWorkOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ error: 'Invalid WorkOrder ID' });

    try {
        const deleted = await WorkOrder.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Work order not found' });

        res.json({ message: 'Work order deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting work order' });
    }
};
