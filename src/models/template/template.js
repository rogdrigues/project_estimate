const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    filePath: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft' },
    version: { type: Number, default: 1 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isLocked: { type: Boolean, default: false },
    tags: { type: [String] },
    templateData: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TemplateData' }],
}, { timestamps: true });

templateSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Template', templateSchema);
