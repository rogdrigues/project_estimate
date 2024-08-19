const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const commentSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  // Reference to the project
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },  // User who made the comment
    content: { type: String, required: true },  // Content of the comment
    createdAt: { type: Date, default: Date.now },  // Timestamp when the comment was created
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
commentSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Comment', commentSchema);
