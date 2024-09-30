const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const projectChecklistSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    parentID: { type: Number },
    subClass: { type: String, required: true },
    description: { type: String },
    note: { type: String },
    assessment: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    priority: { type: String, enum: ['Normal', 'High', 'Critical'], default: 'Normal' },
    originalChecklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist' },
}, { timestamps: true });

projectChecklistSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('ProjectChecklist', projectChecklistSchema);
