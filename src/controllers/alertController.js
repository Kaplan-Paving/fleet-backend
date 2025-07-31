import Alert from '../models/Alert.js';
import { createTicketAndWorkOrder } from '../services/ticketService.js';



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

// 1. Import the new service
/**
 * @desc    Acknowledge an alert, create a repair ticket via the service, and link it.
 * @route   PUT /api/alerts/:alertId/acknowledge
 * @access  Private
 */
export const acknowledgeAlert = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        if (alert.acknowledged) {
            return res.status(400).json({ message: 'This alert has already been acknowledged.' });
        }

        // 2. Prepare the data payload for the ticket service
        const ticketDetails = {
            kaplanUnitNo: alert.kaplanUnitNo,
            issueDescription: `Alert Triggered: ${alert.alertType.replace(/_/g, ' ')}`,
            reason: alert.comment || `Generated automatically from alert ID: ${alert._id}`,
            priority: alert.alertLevel,
            ticketStatus: 'Under Diagnosis',
        };

        // 3. Call the reusable service to create the ticket and its work order
        const newTicket = await createTicketAndWorkOrder(ticketDetails);

        // --- Update the Alert ---
        alert.acknowledged = true;
        const user = req.user;
        alert.acknowledgedBy = user ? `${user.name}\n${user.userId}` : 'System';
        alert.ticketNumber = newTicket.ticketNumber;

        const updatedAlert = await alert.save();
        res.status(200).json(updatedAlert);

    } catch (error) {
        console.error("Error in acknowledgeAlert:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ... (Your other alert controller functions)



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
