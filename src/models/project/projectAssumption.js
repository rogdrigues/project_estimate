const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const projectAssumptionSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    content: { type: String, required: false },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    originalAssumptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assumption' },
}, { timestamps: true });

projectAssumptionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('ProjectAssumption', projectAssumptionSchema);
