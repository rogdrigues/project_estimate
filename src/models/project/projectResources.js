const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const projectResourceSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number },
    location: { type: String },
    level: { type: String, enum: ['Junior', 'Mid', 'Senior'] },
    currency: { type: String },
    conversionRate: { type: Number },
    quantity: { type: Number, default: 1 },
    originalResourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
}, { timestamps: true });

projectResourceSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('ProjectResource', projectResourceSchema);
