// models/MechanicWorkLog.js
import mongoose from 'mongoose';

const partSchema = new mongoose.Schema({
    partName: { type: String, required: true },
    partNumber: String,
    quantity: { type: Number, required: true }
}, { _id: false });

const mechanicWorkLogSchema = new mongoose.Schema({
    mechanic: {
        name: { type: String, required: true },      // denormalized
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    kaplanUnit: { type: String, required: true },
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
    date: { type: Date, required: true },
    timeIn: { type: Date, required: true },
    timeOut: { type: Date, required: true },

    partsUsed: [partSchema]
}, { timestamps: true });

export default mongoose.model('MechanicWorkLog', mechanicWorkLogSchema);
