const PresalePlanVersion = require('@models/opportunity/presalePlanVersion');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../../utils/stringUtils');

module.exports = {
    createPresalePlanVersion: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { presalePlan, versionNumber, changes } = req.body;

        try {
            const newVersion = new PresalePlanVersion({
                presalePlan,
                versionNumber,
                changes: sanitizeString(changes),
                updatedBy: req.user.id
            });

            await newVersion.save();
            return res.status(201).json({
                EC: 0,
                message: 'Presale Plan Version created successfully',
                data: newVersion
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating presale plan version',
                data: { error: error.message }
            });
        }
    },

    getVersionsForPresalePlan: async (req, res) => {
        const { presalePlanId } = req.params;

        try {
            const versions = await PresalePlanVersion.find({ presalePlan: presalePlanId })
                .populate('updatedBy')
                .exec();

            return res.status(200).json({
                EC: 0,
                message: 'Versions fetched successfully',
                data: versions
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching versions',
                data: { error: error.message }
            });
        }
    },

    getPresalePlanVersionById: async (req, res) => {
        const { versionId } = req.params;

        try {
            const version = await PresalePlanVersion.findById(versionId)
                .populate('updatedBy')
                .exec();

            if (!version) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Version not found',
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Version fetched successfully',
                data: version
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching version',
                data: { error: error.message }
            });
        }
    },

    deletePresalePlanVersion: async (req, res) => {
        const { versionId } = req.params;

        try {
            const version = await PresalePlanVersion.findById(versionId);

            if (!version) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Version not found',
                    data: null
                });
            }

            await version.delete();

            return res.status(200).json({
                EC: 0,
                message: 'Version deleted successfully',
                data: version
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error deleting version',
                data: { error: error.message }
            });
        }
    }
};
