const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, clearStudentRecord, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

const authValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email').isEmail().withMessage('Valid email is required.'),
  body('studentIdNumber')
    .if((_, { req }) => (req.body.role || 'student') === 'student')
    .trim()
    .notEmpty()
    .withMessage('Student ID number is required for students.'),
  body('faculty')
    .if((_, { req }) => (req.body.role || 'student') === 'student')
    .trim()
    .notEmpty()
    .withMessage('Faculty is required for students.'),
  body('year')
    .if((_, { req }) => (req.body.role || 'student') === 'student')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required for students.'),
  body('semester')
    .if((_, { req }) => (req.body.role || 'student') === 'student')
    .trim()
    .notEmpty()
    .withMessage('Semester is required for students.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must include at least one uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('Password must include at least one lowercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must include at least one number.')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must include at least one special symbol.')
];

router.post('/register', authValidators, register);
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
], login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.delete('/profile/student-record', auth, clearStudentRecord);
router.put('/change-password', auth, changePassword);

module.exports = router;
