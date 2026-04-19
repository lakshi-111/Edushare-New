/**
 * Payment REST API: process (checkout page), CRUD-ish admin routes, /me for buyers,
 * /admin/ledger for admin UI (merged with legacy orders without Payment rows).
 * Route order matters: /admin/* and /me before /:id.
 */
const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const {
  processPayment,
  listMyPayments,
  getPaymentById,
  getAdminPaymentLedger,
  createManualPayment,
  updatePayment,
  updatePaymentStatus,
  deletePayment
} = require('../controllers/paymentController');

const router = express.Router();

router.use(auth);

router.post('/process', processPayment);
router.get('/me', listMyPayments);

router.get('/admin/ledger', requireAdmin, getAdminPaymentLedger);
router.post('/admin/manual', requireAdmin, createManualPayment);

router.put('/:id/status', requireAdmin, updatePaymentStatus);
router.put('/:id', requireAdmin, updatePayment);
router.delete('/:id', requireAdmin, deletePayment);
router.get('/:id', getPaymentById);

module.exports = router;
