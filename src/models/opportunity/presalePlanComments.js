const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const presalePlanCommentSchema = new mongoose.Schema({
    presalePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PresalePlan', required: true },  // Reference to the presale plan
    comment: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },  // User who added the comment
}, { timestamps: true });

presalePlanCommentSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('PresalePlanComment', presalePlanCommentSchema);
