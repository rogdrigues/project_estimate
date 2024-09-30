const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed', "Archive"] },
    category: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },
    startDate: { type: Date },
    deadline: { type: Date },
    budget: { type: Number },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectResource' }],
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectTechnology' }],
    checklists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectChecklist' }],
    assumptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectAssumption' }],
    productivity: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectProductivity' }],
}, { timestamps: true });

projectSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Project', projectSchema);
