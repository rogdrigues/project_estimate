const mongoose = require('mongoose');

const productivitySchema = new mongoose.Schema({
    productivity: { type: Number, required: true },
    technology: { type: String, required: true },
    norm: { type: String, required: true },
    unit: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Productivity', productivitySchema);
