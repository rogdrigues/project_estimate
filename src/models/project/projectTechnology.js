const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const projectTechnologySchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    version: { type: String, required: false },
    category: {
        type: String,
        enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Language'],
        required: true
    },
    standard: { type: String, required: false },
    originalTechId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technology' },
}, { timestamps: true });

projectTechnologySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('ProjectTechnology', projectTechnologySchema);
