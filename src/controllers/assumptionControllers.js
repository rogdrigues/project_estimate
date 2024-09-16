const Assumption = require('../models/assumption');
const Category = require('../models/category');
const xlsx = require('xlsx');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

module.exports = {
    addAssumption: async (req, res) => {
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

        const { title, content, category } = req.body;

        try {
            const newAssumption = new Assumption({
                title,
                content,
                category
            });

            await newAssumption.save();

            return res.status(201).json({
                EC: 0,
                message: "Assumption created successfully",
                data: {
                    result: newAssumption
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error creating Assumption",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    updateAssumption: async (req, res) => {
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
        const { title, content, category } = req.body;

        try {
            const assumption = await Assumption.findById(id);

            if (!assumption) {
                return res.status(404).json({
                    EC: 1,
                    message: "Assumption not found",
                    data: {
                        result: null
                    }
                });
            }

            assumption.title = title || assumption.title;
            assumption.content = content || assumption.content;
            assumption.category = category || assumption.category;

            await assumption.save();

            return res.status(200).json({
                EC: 0,
                message: "Assumption updated successfully",
                data: {
                    result: assumption
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error updating Assumption",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    deleteAssumption: async (req, res) => {
        const { id } = req.params;

        try {
            const assumption = await Assumption.findById(id);

            if (!assumption) {
                return res.status(404).json({
                    EC: 1,
                    message: "Assumption not found",
                    data: {
                        result: null
                    }
                });
            }

            await assumption.delete();

            return res.status(200).json({
                EC: 0,
                message: "Assumption deleted successfully",
                data: {
                    result: assumption
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error deleting Assumption",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    restoreAssumption: async (req, res) => {
        const { id } = req.params;

        try {
            const assumption = await Assumption.findOneWithDeleted({ _id: id });

            if (!assumption) {
                return res.status(404).json({
                    EC: 1,
                    message: "Assumption not found",
                    data: {
                        result: null
                    }
                });
            }

            await assumption.restore();

            return res.status(200).json({
                EC: 0,
                message: "Assumption restored successfully",
                data: {
                    result: assumption
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error restoring Assumption",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getAllAssumptions: async (req, res) => {
        try {
            const { includeDeleted } = req.query;
            const sortCriteria = { deleted: 1, createdAt: -1 };

            let assumptions;

            if (includeDeleted === 'true') {
                assumptions = await Assumption.findWithDeleted()
                    .populate('category')
                    .sort(sortCriteria)
                    .exec();
            } else {
                assumptions = await Assumption.find()
                    .populate('category')
                    .sort(sortCriteria)
                    .exec();
            }

            return res.status(200).json({
                EC: 0,
                message: "Assumptions fetched successfully",
                data: {
                    result: assumptions
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Assumptions",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getAssumptionById: async (req, res) => {
        try {
            const { id } = req.params;
            const assumption = await Assumption.findById(id)
                .populate('category');

            if (!assumption) {
                return res.status(404).json({
                    EC: 1,
                    message: "Assumption not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Assumption fetched successfully",
                data: {
                    result: assumption
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Assumption",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    exportAssumptions: async (req, res) => {
        try {
            const assumptions = await Assumption.find()
                .populate('category')
                .sort({ createdAt: -1 })
                .select('title content category')
                .exec();

            const assumptionData = assumptions.map(assumption => ({
                Title: assumption.title,
                Content: assumption.content,
                Category: assumption.category ? assumption.category.CategoryName : 'N/A'
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet(assumptionData, { skipHeader: true });

            const headers = ['Title', 'Content', 'Category'];
            xlsx.utils.sheet_add_aoa(workSheet, [headers], { origin: 'A1' });
            xlsx.utils.sheet_add_json(workSheet, assumptionData, { skipHeader: true, origin: 'A2' });

            headers.forEach((header, index) => {
                const cellRef = xlsx.utils.encode_cell({ c: index, r: 0 });
                if (!workSheet[cellRef]) workSheet[cellRef] = {};
                workSheet[cellRef].s = { font: { bold: true } };
            });

            const columnWidths = headers.map((header, i) => ({
                wch: Math.max(
                    header.length,
                    ...assumptionData.map(row => (row[header] || '').toString().length)
                )
            }));
            workSheet['!cols'] = columnWidths;

            xlsx.utils.book_append_sheet(workBook, workSheet, 'Assumptions');

            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `assumptions_export_${formattedDate}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while exporting assumptions",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    importAssumptions: [
        upload.single('file'),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        EC: 1,
                        message: "No file uploaded",
                        data: { error: "Please upload a file" }
                    });
                }

                const file = req.file;
                const workBook = xlsx.read(file.buffer, { type: 'buffer' });
                const workSheet = workBook.Sheets[workBook.SheetNames[0]];

                const rows = xlsx.utils.sheet_to_json(workSheet, { header: 1 }).slice(1);

                let errors = [];

                for (let row of rows) {
                    let [title, content, categoryName] = row;

                    const validCategory = await Category.findOne({ CategoryName: categoryName });
                    if (!validCategory) {
                        errors.push({ row, message: `Category ${categoryName} does not exist.` });
                        continue;
                    }

                    let assumption = await Assumption.findOne({ title });

                    if (assumption) {
                        assumption.content = content;
                        assumption.category = validCategory._id;
                    } else {
                        assumption = new Assumption({
                            title,
                            content,
                            category: validCategory._id
                        });
                    }

                    await assumption.save();
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
                    message: "Assumptions imported successfully"
                });

            } catch (error) {
                return res.status(500).json({
                    EC: 1,
                    message: "An error occurred during import",
                    data: { error: error.message }
                });
            }
        }
    ]
};
