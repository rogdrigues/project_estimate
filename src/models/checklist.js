const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const checklistSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  // Reference to the project
    parentID: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist', default: null },  // Reference to the parent checklist item, null if it's a main heading
    subClass: { type: String },  // Represents sub-items under the main heading (e.g., 1.1, 2.1)
    name: { type: String, required: true },  // Name of the checklist item
    description: { type: String },  // Description of the checklist item
    status: { type: Boolean, default: false },  // Status of the item (completed or not)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who created the checklist item
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who last updated the checklist item
    note: { type: String },  // Additional notes for the checklist item
    assessment: { type: String },  // Assessment or evaluation related to the checklist item
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },  // Priority level of the checklist item
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
checklistSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Checklist', checklistSchema);
