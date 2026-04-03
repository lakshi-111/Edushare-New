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

  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return res.status(400).json({ message: 'User already exists with this email.' });

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role === 'admin' ? 'admin' : 'student'
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
  const { name, avatar } = req.body;
  if (typeof name === 'string') req.user.name = name.trim();
  if (typeof avatar === 'string') req.user.avatar = avatar.trim();
  await req.user.save();
  return res.json({ message: 'Profile updated.', user: authPayload(req.user) });
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

module.exports = { register, login, getProfile, updateProfile, changePassword };
