const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const opportunitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    customerName: { type: String, required: true },
    description: { type: String },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    timeline: { type: Date, required: true },
    scope: { type: String },
    budget: { type: Number },
    status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    opportunityLead: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    nation: { type: String, required: true },
    moneyType: { type: String, required: true },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    approvalComment: { type: String },
    approvalDate: { type: Date },
    version: { type: Number, default: 1 },
    presalePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PresalePlan' }
}, { timestamps: true });

opportunitySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
