const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const opportunityVersionSchema = new mongoose.Schema({
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    comment: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    versionNumber: { type: Number, required: true },
}, { timestamps: true });

opportunityVersionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('OpportunityVersion', opportunityVersionSchema);
