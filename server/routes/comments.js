const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createComment,
  getResourceComments,
  updateComment,
  deleteComment,
  reportComment,
  getCommentHistory
} = require('../controllers/commentController');

const router = express.Router();

router.post('/', auth, [body('resourceId').isMongoId(), body('content').trim().notEmpty()], createComment);
router.get('/history', auth, getCommentHistory);
router.get('/:resourceId', getResourceComments);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/report', auth, reportComment);

module.exports = router;
