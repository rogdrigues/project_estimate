const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const technologySchema = new mongoose.Schema({
    name: { type: String, required: true },
    version: { type: String, required: false },
    category: {
        type: String,
        enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Language'],
        required: true
    },
    standard: { type: String, required: false },
}, { timestamps: true });

technologySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Technology', technologySchema);
