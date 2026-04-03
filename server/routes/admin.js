const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const { getDashboard, approveResource, deleteComment, updateUserBadge } = require('../controllers/adminController');

const router = express.Router();

router.use(auth, requireAdmin);
router.get('/dashboard', getDashboard);
router.put('/resources/:id/approve', approveResource);
router.delete('/comments/:id', deleteComment);
router.put('/users/:id/badge', updateUserBadge);

module.exports = router;
