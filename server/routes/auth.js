const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

const authValidators = [
  body('email').isEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
];

router.post('/register', [body('name').trim().isLength({ min: 2 }), ...authValidators], register);
router.post('/login', authValidators, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
