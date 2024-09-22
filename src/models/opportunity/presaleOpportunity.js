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
    approvalComment: { type: String }, // Optional comment from the Opportunity Lead.
    approvalDate: { type: Date },      // The date when the approval or rejection happens.
    version: { type: Number, default: 1 }  // Increment version for new revisions after rejection.
}, { timestamps: true });

opportunitySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
