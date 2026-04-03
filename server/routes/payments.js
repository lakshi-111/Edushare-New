const express = require('express');
const { auth } = require('../middleware/auth');
const { processPayment } = require('../controllers/paymentController');

const router = express.Router();

router.use(auth);
router.post('/process', processPayment);

module.exports = router;
