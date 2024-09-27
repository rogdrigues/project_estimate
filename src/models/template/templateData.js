const mongoose = require('mongoose');

const templateDataSchema = new mongoose.Schema({
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    projectData: {
        projectName: { type: String },
        customer: { type: String },
        status: { type: String },
        division: { type: String },
        process: { type: String }, //status
        lastModifier: { type: String },
    },
    version: {
        versionNumber: { type: Number },
        versionDate: { type: Date },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },
    },
    changesLog: [
        {
            dateChanged: { type: Date, default: Date.now },
            versionDate: { type: Date },
            versionNumber: { type: Number },
            action: { type: String, enum: ['A', 'M', 'D'], required: true },
            changes: { type: String },
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('TemplateData', templateDataSchema);
