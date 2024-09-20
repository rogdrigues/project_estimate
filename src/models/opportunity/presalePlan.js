const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const presalePlanSchema = new mongoose.Schema({
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },  // Reference to the associated opportunity
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },  // Person who created this presale plan
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
    version: { type: Number, default: 1 },  // Current version of the plan
    status: { type: String, enum: ['Draft', 'In Review', 'Approved', 'Rejected'], default: 'Draft' }  // Status of the presale plan
}, { timestamps: true });

presalePlanSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('PresalePlan', presalePlanSchema);
