const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createOrUpdateRating,
  getResourceRatings,
  getUserRating,
  deleteRating,
  getRatingHistory
} = require('../controllers/ratingController');

const router = express.Router();

router.post('/', auth, [body('resourceId').isMongoId(), body('rating').isInt({ min: 1, max: 5 })], createOrUpdateRating);
router.get('/history', auth, getRatingHistory);
router.get('/user/:resourceId', auth, getUserRating);
router.get('/:resourceId', getResourceRatings);
router.delete('/:resourceId', auth, deleteRating);

module.exports = router;
