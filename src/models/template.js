const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Name of the template
    description: { type: String },  // Description of the template
    category: { type: String, required: true },  // Category of the template (e.g., Contract, Report)
    filePath: { type: String, required: true },  // File path or URL to the template file
    fieldSettings: { type: mongoose.Schema.Types.Mixed },  // Configuration settings for fields within the template
    fileDataPath: { type: String },  // Path to the data file associated with the template
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who created the template
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who last updated the template
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
templateSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Template', templateSchema);
