// models/Alert.js
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    kaplanUnitNo: { type: String, required: true },
    assetClass: { type: String, required: true },
    alertType: {
        type: String,
        enum: ['Service_threshold', 'Engine_threshold', 'Miles_threshold', 'MPG_threshold', 'GPH_threshold'],
        required: true
    },
    ticketNumber: { type: String, default: '-' },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: String, default: '-' },
    alertLevel: {
        type: String,
        enum: ['Normal', 'High', 'Critical'],
        default: 'Normal'
    },
    comment: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);
