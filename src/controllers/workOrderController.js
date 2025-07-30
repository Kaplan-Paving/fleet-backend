// controllers/workOrderController.js
import WorkOrder from '../models/WorkOrder.js';
import RepairTicket from '../models/RepairTicket.js';
import mongoose from 'mongoose';




/**
 * @desc    Create a new work order from one or more repair tickets
 * @route   POST /api/workorders
 * @access  Private
 */
export const createWorkOrder = async (req, res) => {
    try {
        const { ticketIds, priority, priorityRank, serviceType, serviceSubType } = req.body;

        // 2. Validate that at least one ticketId is provided
        if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({ message: 'At least one Repair Ticket ID is required to create a Work Order.' });
        }

        // 3. Find the first repair ticket to source the main information
        const primaryTicket = await RepairTicket.findById(ticketIds[0]);
        if (!primaryTicket) {
            return res.status(404).json({ message: `Repair Ticket with ID ${ticketIds[0]} not found.` });
        }

        // 4. Create the new work order, automatically populating key fields from the ticket
        const newWorkOrder = new WorkOrder({
            kaplanUnit: primaryTicket.kaplanUnitNo, // Get Kaplan Unit from the ticket
            description: primaryTicket.issueDescription, // Get description from the ticket
            priority: priority || primaryTicket.priority, // Use provided priority or fallback to ticket's priority
            priorityRank,
            serviceType,
            serviceSubType,
            ticketIds, // Link all provided ticket IDs
        });

        const savedWorkOrder = await newWorkOrder.save();

        // 5. Respond with the newly created and populated work order
        const populatedWorkOrder = await WorkOrder.findById(savedWorkOrder._id).populate('ticketIds');

        res.status(201).json(populatedWorkOrder);

    } catch (error) {
        console.error('Error creating work order:', error);
        res.status(500).json({ message: 'Server error while creating work order.' });
    }
};

/**
 * @desc    Get all work orders, with populated ticket data
 * @route   GET /api/workorders
 * @access  Private
 */
export const getWorkOrders = async (req, res) => {
    try {
        const workOrders = await WorkOrder.find()
            .populate('ticketIds') // This replaces the array of IDs with the full ticket objects
            .sort({ priorityRank: 'asc' });
        res.status(200).json(workOrders);
    } catch (error) {
        console.error('Error fetching work orders:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
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
