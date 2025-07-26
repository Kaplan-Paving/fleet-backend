// clockSchema.js
import mongoose from 'mongoose';

const partUsedSchema = new mongoose.Schema({
    partName: String,
    partNumber: String,
    quantity: Number
}, { _id: false });

const clockSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    kaplanUnit: { type: String },
    partsUsed: [partUsedSchema]
}, { _id: false });

export default clockSchema;
