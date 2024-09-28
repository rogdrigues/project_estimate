const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/templates');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const fileName = path.basename(file.originalname, ext) + '-' + uniqueSuffix + ext;

        cb(null, fileName);
    }
});

const uploadTemplate = multer({ storage });

module.exports = uploadTemplate;
