const { validationResult } = require('express-validator');
const Category = require('../models/category');
const xlsx = require('xlsx');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const { sanitizeString } = require('../utils/stringUtils');

module.exports = {
    addCategory: async (req, res) => {
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

        try {
            let { CategoryName, SubCategory } = req.body;

            CategoryName = sanitizeString(CategoryName);
            SubCategory = sanitizeString(SubCategory);

            const existingCategory = await Category.findOne({ CategoryName });
            if (existingCategory) {
                return res.status(400).json({
                    EC: 1,
                    message: "Category already exists",
                    data: {
                        result: null
                    }
                });
            }

            const newCategory = new Category({
                CategoryName,
                SubCategory
            });

            await newCategory.save();

            return res.status(201).json({
                EC: 0,
                message: "Category created successfully",
                data: {
                    result: newCategory
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error creating Category",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    updateCategory: async (req, res) => {
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

        try {
            const { id } = req.params;
            let { CategoryName, SubCategory } = req.body;

            CategoryName = sanitizeString(CategoryName);
            SubCategory = sanitizeString(SubCategory);

            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({
                    EC: 1,
                    message: "Category not found",
                    data: {
                        result: null
                    }
                });
            }

            category.CategoryName = CategoryName || category.CategoryName;
            category.SubCategory = SubCategory || category.SubCategory;

            await category.save();

            return res.status(200).json({
                EC: 0,
                message: "Category updated successfully",
                data: {
                    result: category
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error updating Category",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;

            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({
                    EC: 1,
                    message: "Category not found",
                    data: {
                        result: null
                    }
                });
            }

            await category.delete();

            return res.status(200).json({
                EC: 0,
                message: "Category deleted successfully",
                data: {
                    result: category
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error deleting Category",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    restoreCategory: async (req, res) => {
        try {
            const { id } = req.params;

            const category = await Category.findOneWithDeleted({ _id: id });
            if (!category) {
                return res.status(404).json({
                    EC: 1,
                    message: "Category not found",
                    data: {
                        result: null
                    }
                });
            }

            await category.restore();

            return res.status(200).json({
                EC: 0,
                message: "Category restored successfully",
                data: {
                    result: category
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error restoring Category",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getAllCategories: async (req, res) => {
        try {
            const { includeDeleted } = req.query;
            const sortCriteria = { deleted: 1, createdAt: -1 };

            let categories;

            if (includeDeleted === 'true') {
                categories = await Category.findWithDeleted()
                    .sort(sortCriteria)
                    .exec();
            } else {
                categories = await Category.find()
                    .sort(sortCriteria)
                    .exec();
            }

            return res.status(200).json({
                EC: 0,
                message: "Categories fetched successfully",
                data: {
                    result: categories
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Categories",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getCategoryById: async (req, res) => {
        try {
            const { id } = req.params;

            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({
                    EC: 1,
                    message: "Category not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Category fetched successfully",
                data: {
                    result: category
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Category",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    exportCategories: async (req, res) => {
        try {
            const categories = await Category.find()
                .sort({ createdAt: -1 })
                .select('CategoryName SubCategory')
                .exec();

            const categoryData = categories.map(category => ({
                CategoryName: category.CategoryName,
                SubCategory: category.SubCategory || 'N/A'
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet(categoryData, { skipHeader: true });

            const headers = ['CategoryName', 'SubCategory'];
            xlsx.utils.sheet_add_aoa(workSheet, [headers], { origin: 'A1' });
            xlsx.utils.book_append_sheet(workBook, workSheet, 'Categories');
            headers.forEach((header, index) => {
                const cellRef = xlsx.utils.encode_cell({ c: index, r: 0 });
                if (!workSheet[cellRef]) workSheet[cellRef] = {};
                workSheet[cellRef].s = { font: { bold: true } };
            });

            const columnWidths = headers.map((header, i) => ({
                wch: Math.max(
                    header.length,
                    ...categoryData.map(row => (row[header] || '').toString().length)
                )
            }));
            workSheet['!cols'] = columnWidths;
            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `categories_export_${formattedDate}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while exporting categories",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    importCategories: [
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
                    let [CategoryName, SubCategory] = row;
                    let category = await Category.findOne({ CategoryName });

                    if (category) {
                        category.SubCategory = SubCategory;
                    } else {
                        category = new Category({
                            CategoryName,
                            SubCategory
                        });
                    }

                    await category.save();
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
                    message: "Categories imported successfully"
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
