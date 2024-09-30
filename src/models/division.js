const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const divisionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },
    code: { type: String, unique: true, required: true },
    logo: { type: String },
}, { timestamps: true });

divisionSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Division', divisionSchema);
