const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

function authPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    badge: user.badge,
    ratingBadge: user.ratingBadge,
    studentIdNumber: user.studentIdNumber || '',
    faculty: user.faculty || '',
    year: user.year || '',
    semester: user.semester || '',
    uploadCount: user.uploadCount,
    totalDownloads: user.totalDownloads,
    totalEarnings: user.totalEarnings,
    averageRating: user.averageRating,
    avatar: user.avatar,
    createdAt: user.createdAt
  };
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed.', errors: errors.array() });

  const { name, email, password, studentIdNumber, faculty, year, semester } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return res.status(400).json({ message: 'User already exists with this email.' });

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: process.env.ALLOW_ADMIN_SIGNUP === 'true' && req.body.role === 'admin' ? 'admin' : 'student',
    studentIdNumber: typeof studentIdNumber === 'string' ? studentIdNumber.trim() : '',
    faculty: typeof faculty === 'string' ? faculty.trim() : '',
    year: typeof year === 'string' ? year.trim() : '',
    semester: typeof semester === 'string' ? semester.trim() : ''
  });

  return res.status(201).json({
    message: 'User registered successfully.',
    token: generateToken(user),
    user: authPayload(user)
  });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed.', errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });

  if (user.isBlocked) return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });

  if (user.banned) return res.status(403).json({ message: 'Your account has been banned due to violations of community guidelines.' });

  return res.json({
    message: 'Login successful.',
    token: generateToken(user),
    user: authPayload(user)
  });
}

async function getProfile(req, res) {
  return res.json({ user: authPayload(req.user) });
}

async function updateProfile(req, res) {
  const { name, avatar, studentIdNumber, faculty, year, semester } = req.body;
  if (typeof name === 'string') req.user.name = name.trim();
  if (typeof avatar === 'string') req.user.avatar = avatar.trim();
  if (typeof studentIdNumber === 'string') req.user.studentIdNumber = studentIdNumber.trim();
  if (typeof faculty === 'string') req.user.faculty = faculty.trim();
  if (typeof year === 'string') req.user.year = year.trim();
  if (typeof semester === 'string') req.user.semester = semester.trim();

  await req.user.save();
  return res.json({ message: 'Profile updated.', user: authPayload(req.user) });
}

async function clearStudentRecord(req, res) {
  req.user.studentIdNumber = '';
  req.user.faculty = '';
  req.user.year = '';
  req.user.semester = '';

  await req.user.save();
  return res.json({ message: 'Student record deleted.', user: authPayload(req.user) });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(400).json({ message: 'Current password is incorrect.' });

  user.password = newPassword;
  await user.save();

  return res.json({ message: 'Password changed successfully.' });
}

module.exports = { register, login, getProfile, updateProfile, clearStudentRecord, changePassword };
