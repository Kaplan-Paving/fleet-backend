import RepairTicket from '../models/RepairTicket.js';
import WorkOrder from '../models/WorkOrder.js';
import { createTicketAndWorkOrder } from '../services/ticketService.js'; // 1. Import the new service
// Note: You no longer need to import WorkOrder here directly

/**
 * @desc    Create a new repair ticket and its work order via the ticket service.
 * @route   POST /api/repair-tickets
 * @access  Private
 */
export const createRepairTicket = async (req, res) => {
    const { kaplanUnitNo, issueDescription, reason, priority } = req.body;

    if (!kaplanUnitNo || !issueDescription || !reason || !priority) {
        return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    try {
        // 2. Call the reusable service with the request body and files
        const savedTicket = await createTicketAndWorkOrder({ ...req.body, attachments: req.files });

        res.status(201).json(savedTicket);
    } catch (error) {
        console.error('Failed to create repair ticket and/or work order:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while creating ticket/work order.' });
    }
};

// --- (Unchanged) Other controller functions ---

// Get all tickets or filter by Kaplan Unit
export const getRepairTickets = async (req, res) => {
    try {
        const { kaplanUnitNo } = req.query;
        const filter = kaplanUnitNo ? { kaplanUnitNo } : {};
        const tickets = await RepairTicket.find(filter).sort({ priorityRank: 1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets', error });
    }
};

export const getRepairTicketById = async (req, res) => {
    const { id } = req.params;
    try {
        const ticket = await RepairTicket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Repair ticket not found' });
        }
        res.status(200).json(ticket);
    } catch (error) {
        console.error('Error fetching repair ticket by ID:', error);
        res.status(500).json({ message: 'Failed to fetch repair ticket', error });
    }
};

export const getAllRepairTickets = async (req, res) => {
    try {
        const tickets = await RepairTicket.find().sort({ priorityRank: 'asc' }); // Sort by rank
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching repair tickets:', error);
        res.status(500).json({ message: 'Failed to fetch repair tickets', error });
    }
};

// Update a ticket
export const updateRepairTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTicket = await RepairTicket.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedTicket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(200).json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update ticket', error });
    }
};

// Delete a ticket and re-rank subsequent tickets
export const deleteRepairTicket = async (req, res) => {
    try {
        const { id } = req.params;

        // Step 1: Find the ticket to be deleted to get its rank
        const ticketToDelete = await RepairTicket.findById(id);
        if (!ticketToDelete) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        const deletedRank = ticketToDelete.priorityRank;

        // Step 2: Delete the actual repair ticket
        await RepairTicket.findByIdAndDelete(id);

        // Step 3: Re-rank all tickets that had a higher priority
        await RepairTicket.updateMany(
            { priorityRank: { $gt: deletedRank } },
            { $inc: { priorityRank: -1 } }
        );

        // Step 4 (UPDATED): Find the associated work order and decide whether to update or delete it
        const associatedWorkOrder = await WorkOrder.findOne({ ticketIds: id });

        if (associatedWorkOrder) {
            if (associatedWorkOrder.ticketIds.length === 1) {
                // If this is the only ticket, delete the entire work order
                await WorkOrder.findByIdAndDelete(associatedWorkOrder._id);
            } else {
                // If there are other tickets, just remove the reference to this one
                await WorkOrder.findByIdAndUpdate(
                    associatedWorkOrder._id,
                    { $pull: { ticketIds: id } }
                );
            }
        }

        res.status(200).json({ message: 'Ticket deleted and associated work order managed successfully' });
    } catch (error) {
        console.error('Failed to delete ticket:', error);
        res.status(500).json({ message: 'Failed to delete ticket', error });
    }
};
export const updateTicketRanks = async (req, res) => {
    try {
        // Expect an array of objects like [{ _id: '...', priorityRank: 1 }, ...]
        const { orderedTickets } = req.body;

        if (!orderedTickets || !Array.isArray(orderedTickets)) {
            return res.status(400).json({ message: 'Invalid data format. Expected an array of tickets.' });
        }

        // Create a series of update operations for a bulk write
        const bulkOps = orderedTickets.map(ticket => ({
            updateOne: {
                filter: { _id: ticket._id },
                update: { $set: { priorityRank: ticket.priorityRank } }
            }
        }));

        // Execute all update operations in a single database call
        if (bulkOps.length > 0) {
            await RepairTicket.bulkWrite(bulkOps);
        }

        res.status(200).json({ message: 'Ticket priority ranks updated successfully.' });

    } catch (error) {
        console.error('Error updating ticket ranks:', error);
        res.status(500).json({ message: 'Server error while updating ranks.' });
    }
};