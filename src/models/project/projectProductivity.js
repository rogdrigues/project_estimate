const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const projectProductivitySchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    productivity: { type: Number, required: true },
    technology: { type: mongoose.Schema.Types.ObjectId, ref: 'Technology', required: false },
    norm: { type: String, enum: ['Division', 'Department', 'Other'], required: true },
    unit: { type: String, enum: ['LOC', 'StoryPoint', 'Screen'], required: true },
    originalProductivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Productivity' },
}, { timestamps: true });

projectProductivitySchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('ProjectProductivity', projectProductivitySchema);
