const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Project name
    description: { type: String },  // Description of the project
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },  // Project status
    category: { type: String, required: true },  // Category of the project
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },  // Reference to the department
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },  // Reference to the division (if needed)
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },  // Reference to the project lead
    startDate: { type: Date },  // Start date of the project
    deadline: { type: Date },  // Deadline for the project
    budget: { type: Number },  // Budget for the project
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],  // Linked resources
    checklists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Checklist' }],  // Linked checklists
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],  // Linked technologies
    assumptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assumption' }],  // Linked assumptions
}, { timestamps: true });

// Integrate mongoose-delete plugin for soft delete functionality
projectSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Project', projectSchema);
