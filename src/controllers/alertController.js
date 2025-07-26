import Alert from '../models/Alert.js';
import User from '../models/User.js'; // Assuming you have a User model to get user info

// @desc    Get all alerts
// @route   GET /api/alerts
export const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 }); // Get latest alerts first
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Acknowledge an alert
// @route   PUT /api/alerts/:alertId/acknowledge
export const acknowledgeAlert = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        alert.acknowledged = !alert.acknowledged;

        if (alert.acknowledged) {
            const user = req.user;
            alert.acknowledgedBy = user ? `${user.name}\n${user.userId}` : 'System';
        } else {
            alert.acknowledgedBy = '-';
        }

        const updatedAlert = await alert.save();
        res.status(200).json(updatedAlert);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add or update a comment for an alert
// @route   PUT /api/alerts/:alertId/comment
export const commentAlert = async (req, res) => {
    try {
        const { comment } = req.body;
        const alert = await Alert.findByIdAndUpdate(
            req.params.alertId, // Use alertId
            { comment },
            { new: true }
        );
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        res.status(200).json(alert);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Change the alert level
// @route   PUT /api/alerts/:alertId/level
export const changeAlertLevel = async (req, res) => {
    try {
        const { level } = req.body;
        // ✅ FIX: Use req.params.alertId to match your route definition
        const alert = await Alert.findByIdAndUpdate(
            req.params.alertId,
            { alertLevel: level },
            { new: true }
        );
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        res.status(200).json(alert);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete an alert
// @route   DELETE /api/alerts/:alertId
export const deleteAlert = async (req, res) => {
    try {
        // Use alertId
        const alert = await Alert.findByIdAndDelete(req.params.alertId);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
