const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { createInquiry, getResourceInquiries, getMyInquiries, answerInquiry } = require('../controllers/inquiryController');

const router = express.Router();

router.post('/', auth, [body('resourceId').isMongoId(), body('subject').trim().notEmpty(), body('message').trim().notEmpty()], createInquiry);
router.get('/my', auth, getMyInquiries);
router.get('/resource/:resourceId', auth, getResourceInquiries);
router.put('/:inquiryId/answer', auth, answerInquiry);

module.exports = router;
