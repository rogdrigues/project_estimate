const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    customerName: { type: String, required: true },
    description: { type: String },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    timeline: { type: String },
    scope: { type: String },
    budget: { type: Number },
    status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' }
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
