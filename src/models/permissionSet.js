const mongoose = require('mongoose');

const permissionSetSchema = new mongoose.Schema({
    roleName: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('PermissionSet', permissionSetSchema);
