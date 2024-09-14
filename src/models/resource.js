const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const resourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },  // Cost per unit
    location: { type: String, required: true },  // Location of the resource 
    level: { type: String, enum: ['Junior', 'Mid', 'Senior'], required: true },  // Level of the resource
    currency: { type: String, required: true },  // Currency used for unitPrice 
    conversionRate: { type: Number },  // Conversion rate to USD
}, { timestamps: true });

// Soft delete functionality
resourceSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Resource', resourceSchema);
