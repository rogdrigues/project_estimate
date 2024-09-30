const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMaster' },
    code: { type: String, unique: true },
    logo: { type: String },
}, { timestamps: true });

departmentSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Department', departmentSchema);
