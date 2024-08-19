const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },  // Reference to the parent Division
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // Reference to the user leading the Department
    code: { type: String, unique: true },  // Unique code for the Department
    logo: { type: String },  // Logo of the Department
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
departmentSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Department', departmentSchema);
