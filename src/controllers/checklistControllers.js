const Checklist = require('@models/checklist');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');
const xlsx = require('xlsx');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const Category = require('@models/category');

module.exports = {
    createChecklist: async (req, res) => {
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

        const { name, description, category, subClass, note, assessment, priority } = req.body;

        try {
            const existingSubClasses = await Checklist.find({ category });

            let parentID = null;

            if (!existingSubClasses.length) {
                parentID = 1;
            } else {
                const existingSubClass = existingSubClasses.find(cl => cl.subClass === subClass);

                if (existingSubClass) {
                    parentID = existingSubClass.parentID;
                } else {
                    const maxParentId = Math.max(...existingSubClasses.map(cl => cl.parentID));
                    parentID = maxParentId + 1;
                }
            }

            const newChecklist = new Checklist({
                name: sanitizeString(name),
                description: sanitizeString(description),
                category,
                parentID,
                subClass: sanitizeString(subClass),
                note,
                assessment,
                priority
            });

            await newChecklist.save();

            return res.status(201).json({
                EC: 0,
                message: 'Checklist created successfully',
                data: newChecklist
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating checklist',
                data: { error: error.message }
            });
        }
    },

    updateChecklist: async (req, res) => {
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
        const { name, description, category, subClass, note, assessment, priority } = req.body;

        try {
            const checklist = await Checklist.findById(id);
            if (!checklist) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Checklist not found',
                    data: { result: null }
                });
            }

            const existingSubClasses = await Checklist.find({ category });

            let parentID = checklist.parentID;

            if (!existingSubClasses.length) {
                parentID = 1;
            } else {
                const existingSubClass = existingSubClasses.find(cl => cl.subClass === subClass);

                if (existingSubClass) {
                    parentID = existingSubClass.parentID;
                } else {
                    const maxParentId = Math.max(...existingSubClasses.map(cl => cl.parentID));
                    parentID = maxParentId + 1;
                }
            }

            checklist.name = sanitizeString(name) || checklist.name;
            checklist.description = sanitizeString(description) || checklist.description;
            checklist.category = category || checklist.category;
            checklist.subClass = sanitizeString(subClass) || checklist.subClass;
            checklist.note = note || checklist.note;
            checklist.assessment = assessment || checklist.assessment;
            checklist.priority = priority || checklist.priority;
            checklist.parentID = parentID;

            await checklist.save();

            return res.status(200).json({
                EC: 0,
                message: 'Checklist updated successfully',
                data: checklist
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating checklist',
                data: { error: error.message }
            });
        }
    },

    getAllChecklists: async (req, res) => {
        try {
            const sortCriteria = { deleted: 1, createdAt: -1 };

            const checklists = await Checklist.findWithDeleted()
                .populate('category')
                .sort(sortCriteria)
                .exec();

            return res.status(200).json({
                EC: 0,
                message: 'Checklists fetched successfully',
                data: { result: checklists }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching checklists',
                data: { result: null, error: error.message }
            });
        }
    },

    getChecklistById: async (req, res) => {
        const { id } = req.params;

        try {
            const checklist = await Checklist.findById(id).populate('category');
            if (!checklist) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Checklist not found',
                    data: { result: null }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Checklist fetched successfully',
                data: { result: checklist }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching checklist',
                data: { result: null, error: error.message }
            });
        }
    },

    deleteChecklist: async (req, res) => {
        const { id } = req.params;

        try {
            const checklist = await Checklist.findById(id);

            if (!checklist) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Checklist not found',
                    data: { result: null }
                });
            }

            await checklist.delete();

            return res.status(200).json({
                EC: 0,
                message: 'Checklist deleted successfully',
                data: { result: checklist }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error deleting checklist',
                data: { result: null, error: error.message }
            });
        }
    },

    restoreChecklist: async (req, res) => {
        const { id } = req.params;

        try {
            const checklist = await Checklist.findOneWithDeleted({ _id: id });

            if (!checklist) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Checklist not found',
                    data: { result: null }
                });
            }

            await checklist.restore();

            return res.status(200).json({
                EC: 0,
                message: 'Checklist restored successfully',
                data: { result: checklist }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error restoring checklist',
                data: { result: null, error: error.message }
            });
        }
    },

    exportChecklists: async (req, res) => {
        try {
            const checklists = await Checklist.find()
                .populate('category', 'CategoryName')
                .select('name category parentID subClass description note assessment priority')
                .sort({ createdAt: -1 })
                .exec();

            const checklistData = checklists.map(checklist => ({
                Name: checklist.name,
                Category: checklist.category ? checklist.category.CategoryName : 'N/A',
                SubClass: checklist.subClass || 'N/A',
                Description: checklist.description || 'N/A',
                Note: checklist.note || 'N/A',
                Assessment: checklist.assessment || 'N/A',
                Priority: checklist.priority || 'Medium'
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet([], { skipHeader: true });
            xlsx.utils.sheet_add_aoa(workSheet, [['Name', 'Category', 'SubClass', 'Description', 'Note', 'Assessment', 'Priority']], { origin: 'A1' });
            xlsx.utils.sheet_add_json(workSheet, checklistData, { skipHeader: true, origin: 'A2' });

            const columnWidths = [
                { wch: Math.max('Name'.length, ...checklistData.map(row => row.Name.length)) },
                { wch: Math.max('Category'.length, ...checklistData.map(row => row.Category.length)) },
                { wch: Math.max('SubClass'.length, ...checklistData.map(row => row.SubClass.length)) },
                { wch: Math.max('Description'.length, ...checklistData.map(row => row.Description.length)) },
                { wch: Math.max('Note'.length, ...checklistData.map(row => row.Note.length)) },
                { wch: Math.max('Assessment'.length, ...checklistData.map(row => row.Assessment.length)) },
                { wch: Math.max('Priority'.length, ...checklistData.map(row => row.Priority.length)) }
            ];
            workSheet['!cols'] = columnWidths;

            xlsx.utils.book_append_sheet(workBook, workSheet, 'Checklists');

            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `checklists_export_${formattedDate}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error exporting checklists',
                data: { error: error.message }
            });
        }
    },

    importChecklists: [
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
                    let [name, categoryName, subClass, description, note, assessment, priority] = row;

                    if (!name || !categoryName) {
                        errors.push({
                            row,
                            message: `Missing required fields: Name and/or Category`
                        });
                        continue;
                    }

                    let category = await Category.findOne({ CategoryName: categoryName });
                    if (!category) {
                        category = new Category({
                            CategoryName: categoryName,
                            SubCategory: 'N/A'
                        });

                        await category.save();
                    }

                    subClass = subClass || "N/A";

                    const existingSubClasses = await Checklist.find({ category: category._id });
                    let parentID = null;

                    if (!existingSubClasses.length) {
                        parentID = 1;
                    } else {
                        const existingSubClass = existingSubClasses.find(cl => cl.subClass === subClass);

                        if (existingSubClass) {
                            parentID = existingSubClass.parentID;
                        } else {
                            const maxParentId = Math.max(...existingSubClasses.map(cl => cl.parentID));
                            parentID = maxParentId + 1;
                        }
                    }

                    let checklist = await Checklist.findOne({ name });

                    if (checklist) {
                        checklist.subClass = subClass || checklist.subClass;
                        checklist.description = description || checklist.description;
                        checklist.note = note || checklist.note;
                        checklist.assessment = assessment || checklist.assessment;
                        checklist.priority = priority || checklist.priority;
                        checklist.parentID = parentID;
                    } else {
                        checklist = new Checklist({
                            name,
                            subClass,
                            description,
                            category: category._id,
                            note,
                            assessment,
                            priority,
                            parentID
                        });
                    }

                    await checklist.save();
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
                    message: 'Checklists imported successfully'
                });

            } catch (error) {
                return res.status(500).json({
                    EC: 1,
                    message: 'Error importing checklists',
                    data: { error: error.message }
                });
            }
        }
    ]

};
