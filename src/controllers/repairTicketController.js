import RepairTicket from '../models/RepairTicket.js';
import WorkOrder from '../models/WorkOrder.js';
// --- (UPDATED) Create a new repair ticket ---
/**
 * @desc    Create a new repair ticket and a corresponding work order.
 * If a work order for the Kaplan Unit already exists, the new
 * work order will reuse the existing workOrderId for grouping.
 * @route   POST /api/tickets (or a dedicated route)
 * @access  Private
 */
export const createRepairTicket = async (req, res) => {
    const { kaplanUnitNo, issueDescription, reason, priority, ticketStatus } = req.body;

    if (!kaplanUnitNo || !issueDescription || !reason || !priority) {
        return res.status(400).json({ message: 'Please fill all required fields: Kaplan Unit, Issue Description, Reason, and Priority.' });
    }

    try {
        // --- Part A: Create the Repair Ticket ---
        const today = new Date();
        const datePart = today.toISOString().split('T')[0].replace(/-/g, '');
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
        const todayCount = await RepairTicket.countDocuments({ createdAt: { $gte: startOfDay } });
        const countPart = (todayCount + 1).toString().padStart(4, '0');
        const kaplanShort = kaplanUnitNo.slice(-4).toUpperCase().padStart(4, 'X');
        const ticketNumber = `TCKT-${datePart}-${kaplanShort}-${countPart}`;

        const highestPriorityTicket = await RepairTicket.findOne().sort({ priorityRank: -1 });
        const nextPriorityRank = highestPriorityTicket ? highestPriorityTicket.priorityRank + 1 : 1;

        const attachments = req.files?.map(file => ({
            url: file.location,
            key: file.key,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        })) || [];

        const newTicket = new RepairTicket({
            ticketNumber,
            priorityRank: nextPriorityRank,
            kaplanUnitNo,
            issueDescription,
            ticketStatus: ticketStatus || 'Under Diagnosis',
            reason,
            priority,
            attachments,
            date: new Date()
        });
        const savedTicket = await newTicket.save();

        // --- Part B: Create a NEW Work Order, reusing workOrderId if applicable ---
        let workOrderIdToUse;

        // Find an existing work order for the same unit to copy its ID
        const existingWorkOrder = await WorkOrder.findOne({ kaplanUnitNo: savedTicket.kaplanUnitNo });

        if (existingWorkOrder && existingWorkOrder.workOrderId) {
            // If one exists, reuse its workOrderId for grouping
            workOrderIdToUse = existingWorkOrder.workOrderId;
        } else {
            // If none exists, generate a new workOrderId
            const highestWorkOrder = await WorkOrder.findOne().sort({ workOrderId: -1 });
            workOrderIdToUse = highestWorkOrder ? (highestWorkOrder.workOrderId || 0) + 1 : 1001; // Start from 1001
        }

        // Determine the next priority rank for the new work order
        const highestRank = await WorkOrder.findOne().sort({ priorityRank: -1 });
        const nextWorkOrderRank = highestRank ? highestRank.priorityRank + 1 : 1;

        // Create the new work order document
        const newWorkOrder = new WorkOrder({
            // ✅ FIX: Changed 'ticketNumber' to the correct field name 'workOrderId'
            workOrderId: workOrderIdToUse,
            kaplanUnitNo: savedTicket.kaplanUnitNo,
            description: savedTicket.issueDescription,
            priority: savedTicket.priority,
            priorityRank: nextWorkOrderRank,
            ticketIds: [savedTicket._id] // Link only the new ticket
        });
        await newWorkOrder.save();

        // Respond with the successfully created ticket
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