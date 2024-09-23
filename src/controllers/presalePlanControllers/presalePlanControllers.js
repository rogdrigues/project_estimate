const PresalePlan = require('../../models/opportunity/presalePlan');
const PresalePlanComment = require('../../models/opportunity/presalePlanComments');
const { validationResult } = require('express-validator');
const moment = require('moment');
const Department = require('../../models/department');
const Division = require('../../models/division');
const PresalePlanVersion = require('../../models/opportunity/presalePlanVersion');

module.exports = {
    createPresalePlan: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { opportunity, name, description, department, division } = req.body;

        try {
            const validDepartment = await Department.findById(department);
            const validDivision = await Division.findById(division);

            if (!validDepartment || !validDivision || validDepartment.division.toString() !== validDivision._id.toString()) {
                return res.status(400).json({
                    EC: 1,
                    message: 'Invalid Department or Division relationship',
                    data: null
                });
            }

            const newPresalePlan = new PresalePlan({
                opportunity,
                name,
                description,
                createdBy: req.user._id,
                department,
                division,
                status: 'Pending',
                version: 1,
                pendingUntil: moment().add(3, 'days').toDate()
            });

            await newPresalePlan.save();

            return res.status(201).json({
                EC: 0,
                message: 'Presale Plan created successfully',
                data: newPresalePlan
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating presale plan',
                data: { error: error.message }
            });
        }
    },

    updatePresalePlan: async (req, res) => {
        const { id } = req.params;
        const { name, description, department, division } = req.body;

        try {
            const presalePlan = await PresalePlan.findById(id);
            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            if (department && division) {
                const validDepartment = await Department.findById(department);
                const validDivision = await Division.findById(division);
                if (!validDepartment || !validDivision || validDepartment.division.toString() !== validDivision._id.toString()) {
                    return res.status(400).json({
                        EC: 1,
                        message: 'Invalid Department or Division relationship',
                        data: null
                    });
                }
            }

            let changes = [];
            if (name && name !== presalePlan.name) changes.push(`Name changed from ${presalePlan.name} to ${name}`);
            if (description && description !== presalePlan.description) changes.push(`Description changed from ${presalePlan.description} to ${description}`);
            if (department && department !== presalePlan.department.toString()) changes.push(`Department changed`);
            if (division && division !== presalePlan.division.toString()) changes.push(`Division changed`);

            const newVersion = new PresalePlanVersion({
                presalePlan: presalePlan._id,
                versionNumber: presalePlan.version,
                changes: changes.join(', '),
                updatedBy: req.user._id
            });

            await newVersion.save();

            presalePlan.name = name || presalePlan.name;
            presalePlan.description = description || presalePlan.description;
            presalePlan.department = department || presalePlan.department;
            presalePlan.division = division || presalePlan.division;
            presalePlan.version += 1;
            await presalePlan.save();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan updated successfully',
                data: presalePlan
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating presale plan',
                data: { error: error.message }
            });
        }
    },

    getAllPresalePlans: async (req, res) => {
        try {
            const presalePlans = await PresalePlan.find()
                .populate('opportunity department division createdBy')
                .exec();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plans fetched successfully',
                data: { result: presalePlans }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching presale plans',
                data: { error: error.message }
            });
        }
    },

    getPresalePlanById: async (req, res) => {
        const { id } = req.params;

        try {
            const presalePlan = await PresalePlan.findById(id)
                .populate('opportunity department division createdBy')
                .populate({ path: 'comments', model: 'PresalePlanComment' }) // Populate comment
                .exec();

            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan fetched successfully',
                data: { result: presalePlan }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching presale plan',
                data: { error: error.message }
            });
        }
    },

    deletePresalePlan: async (req, res) => {
        const { id } = req.params;

        try {
            const presalePlan = await PresalePlan.findById(id);

            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            if (presalePlan.status === 'Approved') {
                return res.status(403).json({
                    EC: 1,
                    message: 'Cannot delete an Approved Presale Plan',
                    data: null
                });
            }

            await presalePlan.delete();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan deleted successfully',
                data: { result: presalePlan }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error deleting presale plan',
                data: { error: error.message }
            });
        }
    },


    restorePresalePlan: async (req, res) => {
        const { id } = req.params;

        try {
            const presalePlan = await PresalePlan.findOneWithDeleted({ _id: id });

            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            if (presalePlan.status === 'Approved') {
                return res.status(403).json({
                    EC: 1,
                    message: 'Cannot restore an Approved Presale Plan',
                    data: null
                });
            }

            await presalePlan.restore();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan restored successfully',
                data: { result: presalePlan }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error restoring presale plan',
                data: { error: error.message }
            });
        }
    }

};
