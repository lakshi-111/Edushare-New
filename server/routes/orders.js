const express = require('express');
const { auth } = require('../middleware/auth');

// Import order-related controller functions
const { 
  createOrder, 
  addFreeResourceToLibrary, 
  getUserOrders, 
  getUserLibrary, 
  getSellerOverview, 
  getAllOrders, 
  updateOrderStatus, 
  withdrawEarnings 
} = require('../controllers/orderController');

const router = express.Router();

// Apply authentication middleware to all order routes
// Ensures that only authenticated users can access the endpoints below
router.use(auth);

// ==========================================
// User Purchasing & Library Routes
// ==========================================

// Process a new checkout/purchase order
router.post('/checkout', createOrder);

// Add a free resource directly to the user's library without requiring payment
router.post('/add-free', addFreeResourceToLibrary);

// Retrieve all transaction history or orders placed by the user
router.get('/my-orders', getUserOrders);

// Retrieve the user's collection of purchased or free acquired resources
router.get('/my-library', getUserLibrary);


// ==========================================
// Seller / Earnings Dashboard Routes
// ==========================================

// Fetch financial stats (total earnings, pending/verified payments) for the seller
router.get('/seller-overview', getSellerOverview);

// Process a withdrawal request for a seller's available (verified) earnings
router.post('/withdraw', withdrawEarnings);


// ==========================================
// Admin Operations Routes
// ==========================================

// Retrieve all orders across the entire platform (for admin dashboard logs)
router.get('/all', getAllOrders);

// Update the status of a specific order (e.g., from 'pending' to 'paid' or 'verified')
router.put('/:id/status', updateOrderStatus);


module.exports = router;
