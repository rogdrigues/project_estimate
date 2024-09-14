const Resource = require('../models/resource');
const getConversionRate = require('../services/exchangeRateService');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const xlsx = require('xlsx');
const { sanitizeString } = require('../utils/sanitizer');

module.exports = {
    createResource: async (req, res) => {
        const { name, unitPrice, location, currency, level } = req.body;

        try {
            const sanitizedName = sanitizeString(name);
            const sanitizedLocation = sanitizeString(location);

            const conversionRate = await getConversionRate(currency);

            const newResource = new Resource({
                name: sanitizedName,
                unitPrice,
                location: sanitizedLocation,
                level,
                currency,
                conversionRate
            });

            await newResource.save();

            return res.status(201).json({
                EC: 0,
                message: 'Resource created successfully',
                data: newResource
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating resource',
                data: { error: error.message }
            });
        }
    },

    updateResource: async (req, res) => {
        const { id } = req.params;
        const { name, unitPrice, location, currency, level } = req.body;

        try {
            const resource = await Resource.findById(id);
            if (!resource) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Resource not found',
                    data: { result: null }
                });
            }

            const sanitizedName = name ? sanitizeString(name) : resource.name;
            const sanitizedLocation = location ? sanitizeString(location) : resource.location;

            let conversionRate = resource.conversionRate;
            if (currency && currency !== resource.currency) {
                conversionRate = await getConversionRate(currency);
            }

            resource.name = sanitizedName;
            resource.unitPrice = unitPrice || resource.unitPrice;
            resource.location = sanitizedLocation;
            resource.level = level || resource.level;
            resource.currency = currency || resource.currency;
            resource.conversionRate = conversionRate;

            await resource.save();

            return res.status(200).json({
                EC: 0,
                message: 'Resource updated successfully',
                data: resource
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating resource',
                data: { error: error.message }
            });
        }
    },
    getAllResources: async (req, res) => {
        try {
            const sortCriteria = { deleted: 1, createdAt: -1 };
            const resources = await Resource.findWithDeleted().sort(sortCriteria).exec();

            return res.status(200).json({
                EC: 0,
                message: 'Resources fetched successfully',
                data: { result: resources }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching resources',
                data: { result: null, error: error.message }
            });
        }
    },
    getResourceById: async (req, res) => {
        const { id } = req.params;

        try {
            const resource = await Resource.findById(id);

            if (!resource) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Resource not found',
                    data: { result: null }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Resource fetched successfully',
                data: { result: resource }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching resource',
                data: { result: null, error: error.message }
            });
        }
    },
    deleteResource: async (req, res) => {
        const { id } = req.params;

        try {
            const resource = await Resource.findById(id);

            if (!resource) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Resource not found',
                    data: { result: null }
                });
            }

            await resource.delete();

            return res.status(200).json({
                EC: 0,
                message: 'Resource deleted successfully',
                data: { result: resource }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error deleting resource',
                data: { result: null, error: error.message }
            });
        }
    },
    restoreResource: async (req, res) => {
        const { id } = req.params;

        try {
            const resource = await Resource.findOneWithDeleted({ _id: id });

            if (!resource) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Resource not found',
                    data: { result: null }
                });
            }

            await resource.restore();

            return res.status(200).json({
                EC: 0,
                message: 'Resource restored successfully',
                data: { result: resource }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error restoring resource',
                data: { result: null, error: error.message }
            });
        }
    },
    exportResources: async (req, res) => {
        try {
            const resources = await Resource.find().select('name unitPrice location level currency conversionRate').exec();

            const resourceData = resources.map(resource => ({
                Name: resource.name,
                UnitPrice: resource.unitPrice,
                Location: resource.location,
                Level: resource.level,
                Currency: resource.currency,
                ConversionRate: resource.conversionRate
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet(resourceData, { skipHeader: true });

            const headers = ['Name', 'UnitPrice', 'Location', 'Level', 'Currency', 'ConversionRate'];
            xlsx.utils.sheet_add_aoa(workSheet, [headers], { origin: 'A1' });

            headers.forEach((header, index) => {
                const cellRef = xlsx.utils.encode_cell({ c: index, r: 0 });
                if (!workSheet[cellRef]) workSheet[cellRef] = {};
                workSheet[cellRef].s = { font: { bold: true } };
            });

            const columnWidths = headers.map((header, i) => ({
                wch: Math.max(
                    header.length,
                    ...resourceData.map(row => (row[header] || '').toString().length)
                )
            }));
            workSheet['!cols'] = columnWidths;

            xlsx.utils.book_append_sheet(workBook, workSheet, 'Resources');

            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `resources_export_${formattedDate}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error exporting resources',
                data: { result: null, error: error.message }
            });
        }
    },
    importResources: [
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
                    let [name, unitPrice, location, level, currency] = row;

                    if (!name || !unitPrice || !location || !level || !currency) {
                        errors.push({ row, message: "Missing required fields" });
                        continue;
                    }

                    let conversionRate;
                    try {
                        conversionRate = await getConversionRate(currency);
                    } catch (err) {
                        errors.push({ row, message: `Error getting conversion rate for currency: ${currency}` });
                        continue;
                    }

                    let resource = await Resource.findOne({ name });
                    if (resource) {
                        resource.unitPrice = unitPrice || resource.unitPrice;
                        resource.location = location || resource.location;
                        resource.level = level || resource.level;
                        resource.currency = currency || resource.currency;
                        resource.conversionRate = conversionRate;
                    } else {
                        resource = new Resource({
                            name,
                            unitPrice,
                            location,
                            level,
                            currency,
                            conversionRate
                        });
                    }

                    try {
                        await resource.save();
                    } catch (err) {
                        errors.push({ row, message: `Error saving resource: ${err.message}` });
                    }
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
                    message: 'Resources imported successfully'
                });
            } catch (error) {
                return res.status(500).json({
                    EC: 1,
                    message: 'Error importing resources',
                    data: { error: error.message }
                });
            }
        }
    ]
};
