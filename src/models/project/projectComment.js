const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const ProjectCommentSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isResolved: { type: Boolean, default: false },
    action: {
        type: String,
        enum: ['Review', 'Approval', 'Feedback'],
        default: 'Review'
    },
    decision: {
        type: String,
        enum: ['Approved', 'Rejected', 'Pending'],
        default: 'Pending'
    },
}, { timestamps: true });

ProjectCommentSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('ProjectComment', ProjectCommentSchema);
