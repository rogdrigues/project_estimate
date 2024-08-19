const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const masterDataHistorySchema = new mongoose.Schema({
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },  // User who imported the data
    filePath: { type: String, required: true },  // Path to the imported data file
    fileName: { type: String, required: true },  // Name of the imported file
    importedAt: { type: Date, default: Date.now },  // Time when the data was imported
    version: { type: String, required: true },  // Version of the data imported
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },  // Reference to the project (if applicable)
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
masterDataHistorySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('MasterDataHistory', masterDataHistorySchema);
