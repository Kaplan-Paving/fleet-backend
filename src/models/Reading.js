import mongoose from 'mongoose';

const readingSchema = new mongoose.Schema({
    assetClass: {
        type: String,
        ref: 'Asset',
        required: true
    },
    kaplanUnitNo: {
        type: String,
        required: true,
        index: true
    },
    user: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    odometer: {
        type: Number // store as a clean numeric value
    },
    fuelUpdate: {
        type: Number // store gallons as number
    },
    statusUpdate: {
        type: String,
        enum: ['In Use', 'Idle', 'Under Maintenance'],
        default: 'In Use'
    },
    hours: {
        type: Number
    }
}, {
    timestamps: true
});
export default mongoose.model('Reading', readingSchema);