const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const productivitySchema = new mongoose.Schema({
    productivity: { type: Number, required: true },
    technology: { type: mongoose.Schema.Types.ObjectId, ref: 'Technology', required: false },
    norm: { type: String, enum: ['Division', 'Department', 'Other'], required: true },
    unit: { type: String, enum: ['LOC', 'StoryPoint', 'Screen'], required: true },
}, { timestamps: true });

productivitySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Productivity', productivitySchema);
