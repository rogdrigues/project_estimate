const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const categorySchema = new mongoose.Schema({
    CategoryName: { type: String, required: true, unique: true },
    SubCategory: { type: String, required: false },
}, { timestamps: true });

categorySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Category', categorySchema);
