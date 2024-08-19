const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const divisionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // Reference to the user leading the Division
    code: { type: String, unique: true },  // Unique code for the Division
    logo: { type: String },  // Logo of the Division
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
divisionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Division', divisionSchema);
