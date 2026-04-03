const express = require('express');
const { body } = require('express-validator');
const { auth, optionalAuth } = require('../middleware/auth');
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  getMyResources
} = require('../controllers/resourceController');

const router = express.Router();

router.get('/', optionalAuth, getResources);
router.get('/my/list', auth, getMyResources);
router.get('/:id', optionalAuth, getResourceById);
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('fileUrl').notEmpty(),
    body('fileName').notEmpty(),
    body('fileSize').isNumeric(),
    body('fileType').notEmpty(),
    body('category').trim().notEmpty(),
    body('faculty').trim().notEmpty(),
    body('academicYear').trim().notEmpty(),
    body('semester').optional().trim(),
    body('moduleCode').optional().trim()
  ],
  createResource
);
router.put('/:id', auth, updateResource);
router.delete('/:id', auth, deleteResource);
router.post('/:id/download', auth, downloadResource);

module.exports = router;
