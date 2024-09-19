const mongoose = require('mongoose');

const presalePlanVersionSchema = new mongoose.Schema({
    presalePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PresalePlan', required: true },
    filePath: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },
    versionStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('PresalePlanVersion', presalePlanVersionSchema);
