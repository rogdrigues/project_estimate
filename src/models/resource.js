const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const resourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    location: { type: String, required: true },
    level: { type: String, enum: ['Junior', 'Mid', 'Senior'], required: true },
    currency: { type: String, required: true },
    conversionRate: { type: Number },
}, { timestamps: true });

resourceSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Resource', resourceSchema);
