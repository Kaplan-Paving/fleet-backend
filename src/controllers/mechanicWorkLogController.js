// controllers/mechanicWorkLogController.js
import MechanicWorkLog from '../models/MechanicWorkLog.js';
import RepairTicket from '../models/RepairTicket.js';

export const createWorkLog = async (req, res) => {
    try {
        const {
            mechanic,
            kaplanUnit,
            workOrderId,
            ticketId,
            date,
            timeIn,
            timeOut,
            partsUsed
        } = req.body;

        // Optional: auto-fetch ticket number
        const ticket = await RepairTicket.findById(ticketId);
        const ticketNumber = ticket ? ticket.ticketNumber : undefined;

        const newLog = new MechanicWorkLog({
            mechanic,
            kaplanUnit,
            workOrderId,
            ticketId,
            ticketNumber,
            date,
            timeIn,
            timeOut,
            partsUsed
        });

        await newLog.save();
        res.status(201).json({ success: true, data: newLog });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateWorkLog = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await MechanicWorkLog.findByIdAndUpdate(id, req.body, {
            new: true
        });
        if (!updated) return res.status(404).json({ message: 'Log not found' });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteWorkLog = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MechanicWorkLog.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Log not found' });
        res.json({ success: true, message: 'Log deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getWorkLogs = async (req, res) => {
    try {
        const filters = req.query || {}; // You can filter by mechanic.userId, kaplanUnit, etc.
        const logs = await MechanicWorkLog.find(filters).sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
