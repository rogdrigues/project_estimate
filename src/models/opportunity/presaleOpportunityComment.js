const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const opportunityComment = new mongoose.Schema({
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    comment: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    approvalStatus: { type: String, enum: ['Approved', 'Rejected'] },
}, { timestamps: true });

opportunityComment.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('OpportunityComment', opportunityComment);
