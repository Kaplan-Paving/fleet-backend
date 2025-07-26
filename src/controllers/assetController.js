import Asset from '../models/Asset.js';


export const createAsset = async (req, res) => {
    try {
        const asset = new Asset(req.body);
        // Mongoose will automatically validate the schema types here
        await asset.save();
        res.status(201).json(asset);
    } catch (err) {
        // Log the full error to the console for server-side debugging
        console.error('Error creating asset:', err);

        // --- Detailed Error Handling ---

        // 1. Handle Mongoose Validation Errors (e.g., incorrect data types)
        if (err.name === 'ValidationError') {
            // Extract all the error messages from the error object
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                message: 'Validation failed. Please check the data you entered.',
                errors: messages // Provides an array of specific error details
            });
        }

        // 2. Handle Duplicate Key Errors from MongoDB
        // This is useful if you add a `unique: true` constraint to your schema later
        if (err.code && err.code === 11000) {
            const field = Object.keys(err.keyValue)[0]; // Get the field that caused the error
            return res.status(409).json({ // 409 Conflict is a better status code for this
                message: `An asset with this ${field} already exists. Please use a unique value.`
            });
        }

        // 3. Generic catch-all for any other server errors
        res.status(500).json({
            message: 'An unexpected error occurred on the server.',
            error: err.message // Send back the specific error message
        });
    }
};

export const getAllAssets = async (req, res) => {
    try {
        const assets = await Asset.find();
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json({ message: 'Asset deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
