const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const assumptionSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  // Reference to the project
    content: { type: String, required: true },  // Content of the assumption
    type: { type: String },  // Type of assumption (e.g., Technical, Business, Resource)
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },  // Status of the assumption
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who created the assumption
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who last updated the assumption
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
assumptionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Assumption', assumptionSchema);
