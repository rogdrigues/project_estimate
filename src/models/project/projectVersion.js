const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const versionSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  // Reference to the project
    versionNumber: { type: Number, required: true },  // Version number of the project
    changes: { type: String, required: true },  // Details of the changes in this version
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },  // User who made the changes
    createdAt: { type: Date, default: Date.now },  // Time when the version was created
}, { timestamps: true });

// Integrate mongoose-delete for soft delete functionality
versionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Version', versionSchema);
