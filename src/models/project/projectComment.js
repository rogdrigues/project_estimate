const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const commentSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },  // Reference to the related project
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },  // Reference to the user who made the comment
    comment: { type: String, required: true },  // The actual comment content
    createdAt: { type: Date, default: Date.now },  // Time when the comment was made
    isResolved: { type: Boolean, default: false },  // Flag to mark if the comment is resolved or not
    action: { type: String, enum: ['Review', 'Approval', 'Feedback'], default: 'Review' } // Type of comment
}, { timestamps: true });

// Integrate mongoose-delete for soft delete functionality
commentSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Comment', commentSchema);
