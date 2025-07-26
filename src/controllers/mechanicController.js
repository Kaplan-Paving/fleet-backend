import User from '../models/User.js';
import MechanicWorkLog from '../models/MechanicWorkLog.js';

export const getDailyProductivity = async (req, res) => {
    try {
        const { userId, date } = req.query;
        if (!userId || !date) {
            return res.status(400).json({ error: 'userId and date are required' });
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'mechanic') {
            return res.status(404).json({ error: 'Mechanic not found or invalid role' });
        }

        // Shift hours based on fixed clockIn/Out
        const shiftStart = new Date(date);
        shiftStart.setHours(user.clockIn.getHours(), user.clockIn.getMinutes(), 0, 0);
        const shiftEnd = new Date(date);
        shiftEnd.setHours(user.clockOut.getHours(), user.clockOut.getMinutes(), 0, 0);
        const shiftHours = (shiftEnd - shiftStart) / (1000 * 60 * 60); // in hours

        // Get MechanicWorkLogs for that day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const workLogs = await MechanicWorkLog.find({
            'mechanic.userId': user._id,
            date: { $gte: dayStart, $lte: dayEnd }
        });

        const totalWorkMs = workLogs.reduce((sum, log) => {
            return sum + (new Date(log.timeOut) - new Date(log.timeIn));
        }, 0);
        const workedHours = totalWorkMs / (1000 * 60 * 60);

        const unitsWorkedOn = new Set(workLogs.map(log => log.kaplanUnit)).size;
        const ticketsClosed = workLogs.length;

        const productivity = shiftHours > 0 ? (workedHours / shiftHours) * 100 : 0;

        res.json({
            name: user.name,
            date: dayStart.toISOString().split('T')[0],
            shiftHours: Number(shiftHours.toFixed(2)),
            workedHours: Number(workedHours.toFixed(2)),
            productivity: Number(productivity.toFixed(1)),
            unitsWorkedOn,
            ticketsClosed
        });
    } catch (error) {
        console.error('Error getting productivity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
