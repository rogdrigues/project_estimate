const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const presalePlanVersionSchema = new mongoose.Schema({
    presalePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PresalePlan', required: true },  // Reference to the associated presale plan
    versionNumber: { type: Number, required: true },  // Version number
    changes: { type: String, required: true },  // Details of the changes in this version
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },  // Person who made the updates
}, { timestamps: true });

presalePlanVersionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('PresalePlanVersion', presalePlanVersionSchema);
