import RepairTicket from '../models/RepairTicket.js';

// --- (UPDATED) Create a new repair ticket ---
export const createRepairTicket = async (req, res) => {
    // 1. Destructure the expected fields from the multipart form body
    console.log('--- INSIDE CONTROLLER ---');
    console.log('Request Body:', req.body);
    console.log('Request Files:', req.files);
    const { kaplanUnitNo, issueDescription, reason, priority, ticketStatus } = req.body;

    // 2. Add robust validation for required fields from the modal
    if (!kaplanUnitNo || !issueDescription || !reason || !priority) {
        return res.status(400).json({ message: 'Please fill all required fields: Kaplan Unit, Issue Description, Reason, and Priority.' });
    }

    try {
        // --- Ticket Number Generation ---
        const today = new Date();
        const datePart = today.toISOString().split('T')[0].replace(/-/g, '');
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
        const todayCount = await RepairTicket.countDocuments({ createdAt: { $gte: startOfDay } });
        const countPart = (todayCount + 1).toString().padStart(4, '0');
        const kaplanShort = kaplanUnitNo.slice(-4).toUpperCase().padStart(4, 'X');
        const ticketNumber = `TCKT-${datePart}-${kaplanShort}-${countPart}`;

        // --- Priority Rank Generation ---
        const highestPriorityTicket = await RepairTicket.findOne().sort({ priorityRank: -1 });
        const nextPriorityRank = highestPriorityTicket ? highestPriorityTicket.priorityRank + 1 : 1;

        // --- Handle Attachments ---
        const attachments = req.files?.map(file => ({
            url: file.location, // This assumes you are using multer-s3. For local storage, it would be `file.path`
            key: file.key,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        })) || [];

        // 3. Create the new ticket using the validated and generated data
        const newTicket = new RepairTicket({
            ticketNumber,
            priorityRank: nextPriorityRank,
            kaplanUnitNo,
            issueDescription,
            ticketStatus: ticketStatus || 'Under Diagnosis', // Use status from body or default
            reason,
            priority,
            attachments,
            date: new Date() // Set the date explicitly
        });

        const savedTicket = await newTicket.save();
        res.status(201).json(savedTicket);
    } catch (error) {
        console.error('Failed to create repair ticket:', error);
        // Provide more specific error feedback
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while creating ticket.' });
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
        const ticketToDelete = await RepairTicket.findById(id);
        if (!ticketToDelete) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        const deletedRank = ticketToDelete.priorityRank;
        await RepairTicket.findByIdAndDelete(id);
        await RepairTicket.updateMany(
            { priorityRank: { $gt: deletedRank } },
            { $inc: { priorityRank: -1 } }
        );
        res.status(200).json({ message: 'Ticket deleted and ranks updated successfully' });
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