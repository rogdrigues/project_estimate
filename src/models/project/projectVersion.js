const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const versionSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    versionNumber: { type: Number, required: true },
    changes: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster', required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

versionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Version', versionSchema);
