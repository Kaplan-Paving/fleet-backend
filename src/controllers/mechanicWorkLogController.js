import MechanicWorkLog from '../models/MechanicWorkLog.js';
import User from '../models/User.js'; // Needed to get mechanic's name
import WorkOrder from '../models/WorkOrder.js'; // Needed for validation

/**
 * @desc    Create a new mechanic work log for a specific work order
 * @route   POST /api/worklogs
 * @access  Private
 */
export const createWorkLog = async (req, res) => {
    try {
        const {
            mechanicUserId,
            workOrderId,
            kaplanUnitNo,
            date,
            timeIn,
            timeOut,
            laborHours,
            partsUsed,
            resolutionNote
        } = req.body;

        // --- Validation ---
        if (!mechanicUserId || !workOrderId || !date || !timeIn || !timeOut || !kaplanUnitNo) {
            return res.status(400).json({ message: 'Mechanic, Work Order ID, Kaplan Unit, Date, Time In, and Time Out are required.' });
        }

        const mechanic = await User.findById(mechanicUserId);
        if (!mechanic) {
            return res.status(404).json({ message: 'Mechanic user not found.' });
        }

        const workOrder = await WorkOrder.findById(workOrderId);
        if (!workOrder) {
            return res.status(404).json({ message: 'Work Order not found.' });
        }

        // Combine date and time strings into valid Date objects
        const baseDate = new Date(date);
        const [inHours, inMinutes] = timeIn.split(':');
        const timeInDate = new Date(new Date(baseDate).setHours(inHours, inMinutes, 0, 0));

        const [outHours, outMinutes] = timeOut.split(':');
        const timeOutDate = new Date(new Date(baseDate).setHours(outHours, outMinutes, 0, 0));

        const newLog = new MechanicWorkLog({
            mechanic: {
                name: mechanic.name,
                userId: mechanicUserId
            },
            kaplanUnitNo: kaplanUnitNo,
            workOrderId,
            date: baseDate,
            timeIn: timeInDate,
            timeOut: timeOutDate,
            laborHours,
            partsUsed,
            resolutionNote
        });

        await newLog.save();
        res.status(201).json({ success: true, data: newLog });
    } catch (err) {
        console.error("Error creating work log:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Get all work logs for a specific work order
 * @route   GET /api/worklogs/:workOrderId
 * @access  Private
 */
export const getWorkLogsForOrder = async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const logs = await MechanicWorkLog.find({ workOrderId }).sort({ date: -1 });
        res.status(200).json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


/**
 * @desc    Update a specific work log
 * @route   PUT /api/worklogs/:logId
 * @access  Private
 */
export const updateWorkLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const updateData = req.body;

        // Also handle date/time conversion on update
        if (updateData.date && updateData.timeIn) {
            const baseDate = new Date(updateData.date);
            const [inHours, inMinutes] = updateData.timeIn.split(':');
            updateData.timeIn = new Date(new Date(baseDate).setHours(inHours, inMinutes, 0, 0));
        }
        if (updateData.date && updateData.timeOut) {
            const baseDate = new Date(updateData.date);
            const [outHours, outMinutes] = updateData.timeOut.split(':');
            updateData.timeOut = new Date(new Date(baseDate).setHours(outHours, outMinutes, 0, 0));
        }

        const updatedLog = await MechanicWorkLog.findByIdAndUpdate(logId, updateData, {
            new: true,
            runValidators: true
        });
        if (!updatedLog) return res.status(404).json({ message: 'Log not found' });
        res.status(200).json({ success: true, data: updatedLog });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Delete a specific work log
 * @route   DELETE /api/worklogs/:logId
 * @access  Private
 */
export const deleteWorkLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const deletedLog = await MechanicWorkLog.findByIdAndDelete(logId);
        if (!deletedLog) return res.status(404).json({ message: 'Log not found' });
        res.status(200).json({ success: true, message: 'Log deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
