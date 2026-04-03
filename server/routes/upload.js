const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { auth } = require('../middleware/auth');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({
    message: 'File uploaded successfully.',
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'file'
  });
});

module.exports = router;
