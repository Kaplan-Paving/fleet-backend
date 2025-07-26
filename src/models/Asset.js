import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
    kaplanUnitNo: { type: String },
    bravoUnitNo: { type: String },
    year: { type: Number },
    make: { type: String },
    model: { type: String },
    color: { type: String },
    datePurchased: { type: Date },
    purchaseAmount: { type: Number },
    paymentMethod: { type: String }, // e.g., Lease, Cash
    lienHolderName: { type: String },
    paymentTerms: { type: String },
    numberOfPayments: { type: Number },
    purchasedFrom: { type: String },
    assetType: { type: String }, // e.g., Vehicle
    subAssetType: { type: String },
    vinSerialNumber: { type: String },
    licensePlateNo: { type: String },
    registrationExpirationDate: { type: Date },
    registrationId: { type: String },
    registrationPin: { type: String },
    registrationStatusNotes: { type: String },
    registrationDate: { type: Date },
    driverOperator: { type: String },
    ipassSerialNumber: { type: String },
    ipassType: { type: String },
    fuelType: { type: String }, // e.g., Diesel
    gasTankSize: { type: String },
    axleCount: { type: Number },
    wheelCount: { type: Number, default: 4 },
    transmissionType: { type: String }, // e.g., Automatic
    summerProfitCenter: { type: String },
    winterProfitCenter: { type: String },
    fleetOwnedBy: { type: String },
    insured: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    estimatedUsefulLife: { type: String }, // e.g., "5 Years"
    latestOdometerHourReading: { type: String },
    titleNo: { type: String },
    titleLocation: { type: String },
    tollIpassTransponderType: { type: String },
    tollIpassTransponderNumber: { type: String },
    status: {
        type: String,
        enum: ['Active', 'Out for Service'],
        default: 'Active'
    }
}, {
    timestamps: true
});

export default mongoose.model('Asset', assetSchema);
