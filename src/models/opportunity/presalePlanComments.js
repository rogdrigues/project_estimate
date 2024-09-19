const mongoose = require('mongoose');

const presalePlanCommentsSchema = new mongoose.Schema({
    presalePlanVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'PresalePlanVersion', required: true },
    commentText: { type: String, required: true }, // The comment text
    commentType: { type: String, enum: ['Note', 'Question', 'Feedback'], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' }
}, { timestamps: true });

module.exports = mongoose.model('PresalePlanComments', presalePlanCommentsSchema);
