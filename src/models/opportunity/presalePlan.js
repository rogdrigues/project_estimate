const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const presalePlanSchema = new mongoose.Schema({
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    rejectionReason: { type: String },
    pendingUntil: { type: Date },
    version: { type: Number, default: 1 },
}, { timestamps: true });

presalePlanSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('PresalePlan', presalePlanSchema);
