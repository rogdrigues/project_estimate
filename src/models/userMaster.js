const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const userMasterSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'PermissionSet', required: true },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },  // Reference to Division
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },  // Reference to Department
    profile: {
        fullName: { type: String, required: true },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },  // Gender information
        phoneNumber: { type: String },
        location: { type: String },
        avatar: { type: String },
    },
    refreshToken: { type: String },  // Storage refresh token
    lastLogin: { type: Date },  // Timestamp for last login
}, { timestamps: true });  // Automatically adds createdAt and updatedAt fields

// Integrate mongoose-delete plugin for soft delete functionality
userMasterSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('UserMaster', userMasterSchema);
