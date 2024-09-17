const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const checklistSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Name of the checklist item
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },  // Reference to category
    parentID: { type: Number },  // ParentID is a numeric identifier
    subClass: { type: String },   // Subclass of the checklist item
    description: { type: String },  // Description of the checklist item
    note: { type: String },  // Additional notes for the checklist item
    assessment: { type: String },  // Assessment or evaluation related to the checklist item
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },  // Priority level of the checklist item
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
checklistSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Checklist', checklistSchema);
