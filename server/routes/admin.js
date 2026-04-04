const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const { getDashboard, approveResource, deleteResource, deleteComment, updateUserBadge, updateUserRole, toggleUserBlock, removeUser } = require('../controllers/adminController');

const router = express.Router();

router.use(auth, requireAdmin);
router.get('/dashboard', getDashboard);
router.put('/resources/:id/approve', approveResource);
router.delete('/resources/:id', deleteResource);
router.delete('/comments/:id', deleteComment);
router.put('/users/:id/badge', updateUserBadge);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/block', toggleUserBlock);
router.delete('/users/:id', removeUser);

module.exports = router;
