const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {

        let folder = 'uploads';
        let allowed_formats = ['jpg', 'png'];

        if (file.mimetype.startsWith('video/')) {
            folder = 'videos';
            allowed_formats = ['mp4', 'avi', 'mkv'];
        } else if (file.mimetype.startsWith('application/')) {
            folder = 'documents';
            allowed_formats = ['pdf', 'docx', 'pptx'];
        }

        return {
            folder: folder,
            allowed_formats: allowed_formats,
            resource_type: 'auto'
        };
    },
});

const upload = multer({ storage });

module.exports = upload;
