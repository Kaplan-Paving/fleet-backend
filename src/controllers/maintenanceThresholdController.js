import MaintenanceThreshold from '../models/MaintenanceThreshold.js';

export const createThreshold = async (req, res) => {
    try {
        const threshold = new MaintenanceThreshold(req.body);
        await threshold.save();
        res.status(201).json(threshold);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getAllThresholds = async (req, res) => {
    try {
        const thresholds = await MaintenanceThreshold.find();
        res.json(thresholds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateThreshold = async (req, res) => {
    try {
        const threshold = await MaintenanceThreshold.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!threshold) {
            return res.status(404).json({ error: 'Threshold not found' });
        }
        res.json(threshold);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteThreshold = async (req, res) => {
    try {
        const threshold = await MaintenanceThreshold.findByIdAndDelete(req.params.id);
        if (!threshold) {
            return res.status(404).json({ error: 'Threshold not found' });
        }
        res.json({ message: 'Threshold deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
