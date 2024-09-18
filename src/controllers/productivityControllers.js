const Productivity = require('../models/productivity');
const xlsx = require('xlsx');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');

module.exports = {
    createProductivity: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: {
                    result: null,
                    errors: errors.array()
                }
            });
        }

        const { productivity, technology, norm, unit } = req.body;

        try {
            const sanitizedNorm = sanitizeString(norm);
            const sanitizedUnit = sanitizeString(unit);

            const newProductivity = new Productivity({
                productivity,
                technology: technology._id,
                norm: sanitizedNorm,
                unit: sanitizedUnit
            });

            await newProductivity.save();

            return res.status(201).json({
                EC: 0,
                message: 'Productivity created successfully',
                data: newProductivity
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating productivity',
                data: { error: error.message }
            });
        }
    },

    updateProductivity: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: {
                    result: null,
                    errors: errors.array()
                }
            });
        }

        const { id } = req.params;
        const { productivity, technology, norm, unit } = req.body;

        try {
            const prod = await Productivity.findById(id);
            if (!prod) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Productivity not found',
                    data: { result: null }
                });
            }


            const sanitizedNorm = sanitizeString(norm);
            const sanitizedUnit = sanitizeString(unit);

            prod.productivity = productivity || prod.productivity;
            prod.technology = technology._id || prod.technology._id;
            prod.norm = sanitizedNorm || prod.norm;
            prod.unit = sanitizedUnit || prod.unit;

            await prod.save();

            return res.status(200).json({
                EC: 0,
                message: 'Productivity updated successfully',
                data: prod
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating productivity',
                data: { error: error.message }
            });
        }
    },

    getAllProductivities: async (req, res) => {
        try {
            const productivities = await Productivity.findWithDeleted()
                .populate('technology', 'name')  // Populate technology name
                .sort({ createdAt: -1 });

            return res.status(200).json({
                EC: 0,
                message: 'Productivities fetched successfully',
                data: { result: productivities }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching productivities',
                data: { error: error.message }
            });
        }
    },

    getProductivityById: async (req, res) => {
        const { id } = req.params;

        try {
            const prod = await Productivity.findById(id).populate('technology', 'name');
            if (!prod) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Productivity not found',
                    data: { result: null }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Productivity fetched successfully',
                data: { result: prod }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching productivity',
                data: { error: error.message }
            });
        }
    },

    deleteProductivity: async (req, res) => {
        const { id } = req.params;

        try {
            const prod = await Productivity.findById(id);
            if (!prod) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Productivity not found',
                    data: { result: null }
                });
            }

            await prod.delete();

            return res.status(200).json({
                EC: 0,
                message: 'Productivity deleted successfully',
                data: { result: prod }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error deleting productivity',
                data: { error: error.message }
            });
        }
    },

    restoreProductivity: async (req, res) => {
        const { id } = req.params;

        try {
            const prod = await Productivity.findOneWithDeleted({ _id: id });
            if (!prod) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Productivity not found',
                    data: { result: null }
                });
            }

            await prod.restore();

            return res.status(200).json({
                EC: 0,
                message: 'Productivity restored successfully',
                data: { result: prod }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error restoring productivity',
                data: { error: error.message }
            });
        }
    },

    exportProductivities: async (req, res) => {
        try {
            const productivities = await Productivity.find()
                .populate('technology', 'name')
                .select('productivity technology norm unit')
                .sort({ createdAt: -1 });

            const productivityData = productivities.map(prod => ({
                Productivity: prod.productivity,
                Technology: prod.technology ? prod.technology.name : 'N/A',
                Norm: prod.norm,
                Unit: prod.unit
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet([], { skipHeader: true });
            xlsx.utils.sheet_add_aoa(workSheet, [['Productivity', 'Technology', 'Norm', 'Unit']], { origin: 'A1' });
            xlsx.utils.sheet_add_json(workSheet, productivityData, { skipHeader: true, origin: 'A2' });

            const columnWidths = ['Productivity', 'Technology', 'Norm', 'Unit'].map(header => ({
                wch: Math.max(header.length, ...productivityData.map(row => (row[header] || '').toString().length))
            }));
            workSheet['!cols'] = columnWidths;

            xlsx.utils.book_append_sheet(workBook, workSheet, 'Productivities');

            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `productivities_export_${formattedDate}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error exporting productivities',
                data: { error: error.message }
            });
        }
    },

    importProductivities: [
        upload.single('file'),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        EC: 1,
                        message: 'No file uploaded',
                        data: { error: 'Please upload a file' }
                    });
                }

                const file = req.file;
                const workBook = xlsx.read(file.buffer, { type: 'buffer' });
                const workSheet = workBook.Sheets[workBook.SheetNames[0]];

                const rows = xlsx.utils.sheet_to_json(workSheet, { header: 1 }).slice(1);
                const errors = [];

                for (let row of rows) {
                    let [productivity, technologyName, norm, unit] = row;

                    if (!productivity || !technologyName || !norm || !unit) {
                        errors.push({
                            row,
                            message: 'Missing required fields'
                        });
                        continue;
                    }

                    const technology = await Technology.findOne({ name: technologyName });
                    if (!technology) {
                        errors.push({
                            row,
                            message: `Technology ${technologyName} not found`
                        });
                        continue;
                    }

                    let prod = await Productivity.findOne({ technology: technology._id, norm, unit });

                    if (prod) {
                        prod.productivity = productivity;
                    } else {
                        prod = new Productivity({
                            productivity,
                            technology: technology._id,
                            norm,
                            unit
                        });
                    }

                    await prod.save();
                }

                if (errors.length > 0) {
                    const errorWorkBook = xlsx.utils.book_new();
                    const errorSheetData = errors.map(error => ({
                        Row: error.row.join(', '),
                        ErrorMessage: error.message
                    }));

                    const errorWorkSheet = xlsx.utils.json_to_sheet(errorSheetData);
                    xlsx.utils.book_append_sheet(errorWorkBook, errorWorkSheet, 'Errors');

                    const errorBuffer = xlsx.write(errorWorkBook, { type: 'buffer', bookType: 'xlsx' });
                    const fileName = `import_errors_${new Date().toISOString()}.xlsx`;

                    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    return res.status(200).send(errorBuffer);
                }

                return res.status(201).json({
                    EC: 0,
                    message: 'Productivities imported successfully'
                });

            } catch (error) {
                return res.status(500).json({
                    EC: 1,
                    message: 'Error importing productivities',
                    data: { error: error.message }
                });
            }
        }
    ]
};
