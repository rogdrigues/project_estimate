const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/templates');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        let fileName = path.basename(file.originalname, ext);

        const dashIndex = fileName.lastIndexOf('-');
        if (dashIndex !== -1) {
            fileName = fileName.substring(0, dashIndex);
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        fileName = fileName + '-' + uniqueSuffix + ext;

        cb(null, fileName);
    }
});

const uploadTemplate = multer({ storage });

module.exports = uploadTemplate;
