const express = require('express');
const { auth } = require('../middleware/auth');
const { createOrder, getUserOrders, getUserLibrary, getSellerOverview, getAllOrders } = require('../controllers/orderController');

const router = express.Router();

router.use(auth);
router.post('/checkout', createOrder);
router.get('/my-orders', getUserOrders);
router.get('/my-library', getUserLibrary);
router.get('/seller-overview', getSellerOverview);
router.get('/all', getAllOrders);

module.exports = router;
