import MaintenanceThreshold from '../models/MaintenanceThreshold.js'; // Adjust path to your model

/**
 * @desc    Create a new set of maintenance thresholds for a sub-asset type
 * @route   POST /api/maintenance-thresholds
 * @access  Private
 */
export const createThreshold = async (req, res) => {
    try {
        const { subAssetType, mpg, gph, serviceThreshold, engineThreshold, milesThreshold } = req.body;

        // Basic validation
        if (!subAssetType || !mpg || !gph || !serviceThreshold || !engineThreshold || !milesThreshold) {
            return res.status(400).json({ message: 'Please provide all required threshold fields.' });
        }

        // Check if thresholds for this sub-asset type already exist
        const existingThreshold = await MaintenanceThreshold.findOne({ subAssetType });
        if (existingThreshold) {
            return res.status(409).json({ message: `Maintenance thresholds for '${subAssetType}' already exist.` });
        }

        const newThresholds = new MaintenanceThreshold({
            subAssetType,
            mpg,
            gph,
            serviceThreshold,
            engineThreshold,
            milesThreshold
        });

        const savedThresholds = await newThresholds.save();
        res.status(201).json(savedThresholds);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


/**
 * @desc    Get maintenance thresholds by sub-asset type
 * @route   GET /api/maintenance-thresholds?subAssetType=...
 * @access  Private
 */
export const getThresholds = async (req, res) => {
    try {
        const { subAssetType } = req.query;
        if (!subAssetType) {
            return res.status(400).json({ message: 'A sub-asset type is required to fetch thresholds.' });
        }

        const thresholds = await MaintenanceThreshold.findOne({ subAssetType });

        if (!thresholds) {
            return res.status(404).json({ message: `Thresholds for '${subAssetType}' have not been set.` });
        }

        res.status(200).json(thresholds);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Update maintenance thresholds
 * @route   PUT /api/maintenance-thresholds/:id
 * @access  Private
 */
export const updateThresholds = async (req, res) => {
    try {
        const updatedThresholds = await MaintenanceThreshold.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedThresholds) {
            return res.status(404).json({ message: 'Threshold settings not found' });
        }
        res.status(200).json(updatedThresholds);
    } catch (error) {
        res.status(400).json({ message: 'Error updating thresholds', error: error.message });
    }
};
