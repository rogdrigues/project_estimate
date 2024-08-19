const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const versionSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  // Reference to the project
    versionNumber: { type: String, required: true },  // Version number (e.g., v1.0, v2.1)
    description: { type: String },  // Description of the version
    filePath: { type: String, required: true },  // File path or URL to the version file
    status: { type: String, enum: ['Draft', 'Approved', 'Rejected'], default: 'Draft' },  // Status of the version
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who created the version
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who last updated the version
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
versionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Version', versionSchema);
