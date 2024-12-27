const Technology = require('@models/technology');
const xlsx = require('xlsx');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const { validationResult } = require('express-validator');

module.exports = {
    createTechnology: async (req, res) => {
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

        const { name, standard, version, category } = req.body;

        try {
            const newTechnology = new Technology({
                name,
                standard,
                version,
                category
            });

            await newTechnology.save();

            return res.status(201).json({
                EC: 0,
                message: 'Technology created successfully',
                data: newTechnology
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating technology',
                data: { error: error.message }
            });
        }
    },

    updateTechnology: async (req, res) => {
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
        const { name, standard, version, category } = req.body;

        try {
            const technology = await Technology.findById(id);
            if (!technology) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Technology not found',
                    data: { result: null }
                });
            }

            technology.name = name || technology.name;
            technology.standard = standard || technology.standard;
            technology.version = version || technology.version;
            technology.category = category || technology.category;

            await technology.save();

            return res.status(200).json({
                EC: 0,
                message: 'Technology updated successfully',
                data: technology
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating technology',
                data: { error: error.message }
            });
        }
    },

    getAllTechnologies: async (req, res) => {
        try {
            const technologies = await Technology.findWithDeleted()
                .sort({ createdAt: -1 })
                .exec();
            return res.status(200).json({
                EC: 0,
                message: 'Technologies fetched successfully',
                data: { result: technologies }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching technologies',
                data: { error: error.message }
            });
        }
    },

    getTechnologyById: async (req, res) => {
        const { id } = req.params;

        try {
            const technology = await Technology.findById(id);
            if (!technology) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Technology not found',
                    data: { result: null }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Technology fetched successfully',
                data: { result: technology }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching technology',
                data: { error: error.message }
            });
        }
    },

    deleteTechnology: async (req, res) => {
        const { id } = req.params;

        try {
            const technology = await Technology.findById(id);
            if (!technology) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Technology not found',
                    data: { result: null }
                });
            }

            await technology.delete();

            return res.status(200).json({
                EC: 0,
                message: 'Technology deleted successfully',
                data: { result: technology }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error deleting technology',
                data: { error: error.message }
            });
        }
    },

    restoreTechnology: async (req, res) => {
        const { id } = req.params;

        try {
            const technology = await Technology.findOneWithDeleted({ _id: id });
            if (!technology) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Technology not found',
                    data: { result: null }
                });
            }

            await technology.restore();

            return res.status(200).json({
                EC: 0,
                message: 'Technology restored successfully',
                data: { result: technology }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error restoring technology',
                data: { error: error.message }
            });
        }
    },

    exportTechnologies: async (req, res) => {
        try {
            const technologies = await Technology.find()
                .select('name standard version category')
                .sort({ createdAt: -1 })
                .exec();

            const technologyData = technologies.map(tech => ({
                Name: tech.name,
                Standard: tech.standard,
                Version: tech.version,
                Category: tech.category
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet([], { skipHeader: true });
            xlsx.utils.sheet_add_aoa(workSheet, [['Name', 'Standard', 'Version', 'Category']], { origin: 'A1' });
            xlsx.utils.sheet_add_json(workSheet, technologyData, { skipHeader: true, origin: 'A2' });

            const columnWidths = ['Name', 'Standard', 'Version', 'Category'].map(header => ({
                wch: Math.max(header.length, ...technologyData.map(row => (row[header] || '').toString().length))
            }));
            workSheet['!cols'] = columnWidths;

            xlsx.utils.book_append_sheet(workBook, workSheet, 'Technologies');

            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `technologies_export_${formattedDate}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error exporting technologies',
                data: { error: error.message }
            });
        }
    },

    importTechnologies: [
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
                let errors = [];

                for (let row of rows) {
                    let [name, standard, version, category] = row;

                    if (!name || !version) {
                        errors.push({
                            row,
                            message: `Missing required fields: Name and/or Version`
                        });
                        continue;
                    }

                    let technology = await Technology.findOne({ name });

                    if (technology) {
                        technology.standard = standard || technology.standard;
                        technology.version = version || technology.version;
                        technology.category = category || technology.category;
                    } else {
                        technology = new Technology({
                            name,
                            standard,
                            version,
                            category
                        });
                    }

                    await technology.save();
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
                    message: 'Technologies imported successfully'
                });

            } catch (error) {
                return res.status(500).json({
                    EC: 1,
                    message: 'Error importing technologies',
                    data: { error: error.message }
                });
            }
        }
    ]
};
