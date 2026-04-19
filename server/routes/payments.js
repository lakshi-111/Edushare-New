const express = require('express');
const { auth } = require('../middleware/auth');
const { processPayment } = require('../controllers/paymentController');

const router = express.Router();

// Apply authentication middleware to ensure only logged-in users can initiate payments
router.use(auth);

// Route to process a new payment request and generate the corresponding order
router.post('/process', processPayment);

module.exports = router;
