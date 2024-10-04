const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const ProjectCommentSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    comment: { type: String, required: true },
    role: { type: String, required: true },
    action: {
        type: String,
        enum: ['Rejected', 'Approval', 'Feedback', 'Chat', 'Review'],
        default: 'Chat'
    },
    decision: {
        type: String,
        enum: ['Approved', 'Rejected', 'Pending'],
        default: 'Pending',
        required: function () { return this.action !== 'Chat'; }
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectComment',
        default: null
    },
    threadState: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
}, { timestamps: true });

ProjectCommentSchema.pre('save', function (next) {
    if (this.action === 'Approval' && ['Approved', 'Rejected'].includes(this.decision)) {
        this.threadState = 'Closed';
    }
    next();
});

ProjectCommentSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('ProjectComment', ProjectCommentSchema);
