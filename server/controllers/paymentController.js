const Order = require('../models/Order');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

/**
 * Process a user's payment during the checkout phase.
 * Simulates checking payment details, creating a central order record,
 * updating the balance of the sellers, and dispatching notifications.
 */
async function processPayment(req, res) {
  const { items, paymentMethod, card } = req.body;
  
  // 1. Initial Validation
  // Ensure that there is at least one item to purchase and a payment method is specified.
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Cart is empty.' });
  if (!paymentMethod) return res.status(400).json({ message: 'Payment method is required.' });

  // 2. Fetch Resources
  // Map incoming item references to their database IDs.
  const resourceIds = items.map((item) => item.resourceId || item._id || item.id);
  const resources = await Resource.find({ _id: { $in: resourceIds } });

  // Check if any resources were deleted or missing before processing payment
  if (resources.length !== resourceIds.length) {
    return res.status(400).json({ message: 'One or more resources were not found.' });
  }

  // 3. Simulate Payment Gateway Processing
  // In a real-world scenario, this would integrate with Stripe, PayPal, etc.
  if (!card?.number || !card?.expiry || !card?.cvv) {
    return res.status(400).json({ message: 'Invalid payment details.' });
  }

  // 4. Construct Order Items 
  // Extract only the necessary details from the resources to freeze the order state snapshot
  const orderItems = resources.map((resource) => ({
    resourceId: resource._id,
    title: resource.title,
    price: resource.price,
    fileUrl: resource.fileUrl,
    fileName: resource.fileName
  }));

  // Calculate the final aggregated price for the order
  const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);

  // 5. Create Order Record
  // Record the purchase dynamically and set it as pending (awaiting further verification if needed)
  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    totalPrice,
    status: 'pending' // Note: Final status confirmation might vary depending on payment gateway workflows
  });

  // 6. Handle Post-Payment Asynchronous Operations (Seller Credits & Notifications)
  await Promise.all(
    resources
      // Prevent notifying or crediting the user if they purchase their own resource
      .filter((resource) => resource.uploaderId.toString() !== req.user._id.toString())
      .map(async (resource) => {
        // Increment the original uploader's total earnings by the resource price
        await User.findByIdAndUpdate(resource.uploaderId, {
          $inc: { totalEarnings: resource.price > 0 ? resource.price : 0 }
        });

        // Send a notification to the seller informing them of the purchase
        return createNotification({
          userId: resource.uploaderId,
          type: 'order',
          title: 'Resource purchased',
          message: `${req.user.name} purchased "${resource.title}".`,
          relatedId: order._id
        });
      })
  );

  // 7. Notify the Buyer
  // Send a success confirmation to the purchaser
  await createNotification({
    userId: req.user._id,
    type: 'payment',
    title: 'Payment successful',
    message: `Your payment of Rs ${totalPrice.toFixed(2)} is complete and resources are added to your library.`,
    relatedId: order._id
  });

  // 8. Return Success Response
  // Provide the finalized order details to the client app
  res.status(201).json({ message: 'Payment processed and order completed.', order, totalPrice });
}

module.exports = { processPayment };