const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const technologySchema = new mongoose.Schema({
    name: { type: String, required: true },  // Name of the technology
    description: { type: String },  // Description of the technology
    category: { type: String, required: true },  // Category of the technology (e.g., Frontend, Backend, Database)
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],  // Linked projects using this technology
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who added the technology
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // User who last updated the technology
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
technologySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Technology', technologySchema);
