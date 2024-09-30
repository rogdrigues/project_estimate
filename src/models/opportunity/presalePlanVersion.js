const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const presalePlanVersionSchema = new mongoose.Schema({
    presalePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PresalePlan', required: true },
    versionNumber: { type: Number, required: true },
    changes: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
}, { timestamps: true });

presalePlanVersionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('PresalePlanVersion', presalePlanVersionSchema);
