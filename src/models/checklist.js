const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const checklistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    parentID: { type: Number },
    subClass: { type: String, require: true },
    description: { type: String },
    note: { type: String },
    assessment: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    priority: { type: String, enum: ['Normal', 'High', 'Critical'], default: 'Normal' },
}, { timestamps: true });

checklistSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Checklist', checklistSchema);
