const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const categorySchema = new mongoose.Schema({
    CategoryName: { type: String, required: true, unique: true }, // Phải là duy nhất
    SubCategory: { type: String, required: false }, // Mô tả chi tiết
}, { timestamps: true });

categorySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Category', categorySchema);
