import mongoose from 'mongoose';

const maintenanceThresholdSchema = new mongoose.Schema({
    subAssetType: { type: String, required: true },
    mpg: { type: Number, required: true },
    gph: { type: Number, required: true },
    serviceThreshold: { type: String, required: true }, // e.g., "6 months"
    engineThreshold: { type: String, required: true },  // e.g., "30 Hr."
    milesThreshold: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('MaintenanceThreshold', maintenanceThresholdSchema);
