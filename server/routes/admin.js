const express = require('express');
const { body } = require('express-validator');
const { auth, requireAdmin } = require('../middleware/auth');
const {
  getDashboard,
  approveResource,
  deleteResource,
  deleteComment,
  updateUserBadge,
  updateUserRole,
  toggleUserBlock,
  getUsers,
  createUser,
  deleteUser,
  getModerationStats,
  getModerationItems,
  dismissReport,
  resolveReport,
  editComment,
  deleteReportedComment,
  warnUser,
  banUser,
  resolveInquiry,
  getStats,
  getRevenue,
  getActivity,
  getResources,
  rejectResource,
  bulkApproveResources,
  bulkRejectResources,
  bulkDeleteResources
} = require('../controllers/adminController');

const router = express.Router();

const adminUserValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email').isEmail().withMessage('Valid email is required.'),
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
    .withMessage('Password must include at least one special symbol.'),
  body('studentIdNumber').trim().optional({ nullable: true, checkFalsy: true }),
  body('faculty').trim().optional({ nullable: true, checkFalsy: true }),
  body('year').trim().optional({ nullable: true, checkFalsy: true }),
  body('role').optional().isIn(['student', 'admin']).withMessage('Invalid role.')
];

router.use(auth, requireAdmin);

// Dashboard and statistics
router.get('/dashboard', getDashboard);
router.get('/stats', getStats);
router.get('/revenue', getRevenue);
router.get('/activity', getActivity);

// User management
router.get('/users', getUsers);
router.post('/users', adminUserValidators, createUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/badge', updateUserBadge);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/block', toggleUserBlock);
router.post('/users/:id/warn', warnUser);
router.put('/users/:id/ban', banUser);

// Moderation and reporting
router.get('/moderation/stats', getModerationStats);
router.get('/moderation', getModerationItems);
router.put('/reports/:id/dismiss', dismissReport);
router.put('/reports/:id/resolve', resolveReport);
router.put('/comments/:id/edit', editComment);
router.delete('/comments/:id', deleteReportedComment);
router.put('/inquiries/:id/resolve', resolveInquiry);

// Resource management
router.get('/resources', getResources);
router.put('/resources/:id/approve', approveResource);
router.put('/resources/:id/reject', rejectResource);
router.delete('/resources/:id', deleteResource);
router.put('/resources/bulk-approve', bulkApproveResources);
router.put('/resources/bulk-reject', bulkRejectResources);
router.delete('/resources/bulk-delete', bulkDeleteResources);

module.exports = router;
