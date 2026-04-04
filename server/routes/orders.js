const express = require('express');
const { auth } = require('../middleware/auth');
const { createOrder, addFreeResourceToLibrary, getUserOrders, getUserLibrary, getSellerOverview, getAllOrders, updateOrderStatus } = require('../controllers/orderController');

const router = express.Router();

router.use(auth);
router.post('/checkout', createOrder);
router.post('/add-free', addFreeResourceToLibrary);
router.get('/my-orders', getUserOrders);
router.get('/my-library', getUserLibrary);
router.get('/seller-overview', getSellerOverview);
router.get('/all', getAllOrders);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
