const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const assumptionSchema = new mongoose.Schema({
    project: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },
}, { timestamps: true });

assumptionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Assumption', assumptionSchema);
