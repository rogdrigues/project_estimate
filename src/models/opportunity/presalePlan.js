const mongoose = require('mongoose');

const presalePlanSchema = new mongoose.Schema({
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },  // Liên kết tới Opportunity
    name: { type: String, required: true },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ['Draft', 'Finalized', 'Approved'], default: 'Draft' }  // Trạng thái
}, { timestamps: true });

module.exports = mongoose.model('PresalePlan', presalePlanSchema);
