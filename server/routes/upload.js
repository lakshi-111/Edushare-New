const express = require('express');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const fs = require('fs');
const { auth } = require('../middleware/auth');

const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary only if credentials exist
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const router = express.Router();

let resourceStorage;
let profilePhotoStorage;

if (useCloudinary) {
  // Cloudinary storage for resource files
  resourceStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'edushare/resources',
      resource_type: 'auto',
      allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'],
      max_file_size: 20 * 1024 * 1024 // 20MB
    }
  });

  // Cloudinary storage for profile photos
  profilePhotoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'edushare/profiles',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      max_file_size: 5 * 1024 * 1024, // 5MB
      quality: 'auto:good',
      fetch_format: 'auto',
      width: 200,
      height: 200,
      crop: 'fill'
    }
  });
} else {
  // Ensure local uploads directory exists
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Local storage fallback for resource files
  resourceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  // Local storage fallback for profile photos
  profilePhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({ storage: resourceStorage, limits: { fileSize: 20 * 1024 * 1024 } });
const profilePhotoUpload = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile photos.'));
    }
  }
});

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  
  // Cloudinary returns the URL directly in req.file.path
  // For local storage, construct full URL
  const fileUrl = useCloudinary 
    ? req.file.path 
    : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
  res.json({
    message: 'File uploaded successfully.',
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'file'
  });
});

// Profile photo upload
router.post('/profile-photo', auth, profilePhotoUpload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No photo uploaded.' });

  try {
    const User = require('../models/User'); // Required here in the original code
    
    // Cloudinary returns the URL directly in req.file.path
    // For local storage, construct full URL
    const fileUrl = useCloudinary 
      ? req.file.path 
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Update user's avatar
    req.user.avatar = fileUrl;
    await req.user.save();

    res.json({
      message: 'Profile photo updated successfully.',
      avatar: fileUrl
    });
  } catch (error) {
    console.error('Profile photo update error:', error);
    res.status(500).json({ message: 'Failed to update profile photo.' });
  }
});

module.exports = router;
