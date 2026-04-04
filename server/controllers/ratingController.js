const Rating = require('../models/Rating');
const Resource = require('../models/Resource');
const { recalculateResourceRating } = require('../utils/resourceHelpers');
const { createNotification } = require('../utils/notifications');

async function createOrUpdateRating(req, res) {
  const { resourceId, rating } = req.body;
  const resource = await Resource.findById(resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const doc = await Rating.findOneAndUpdate(
    { resourceId, userId: req.user._id },
    { rating },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recalculateResourceRating(resourceId);

  if (resource.uploaderId.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: resource.uploaderId,
      type: 'rating',
      title: 'New rating received',
      message: `${req.user.name} rated "${resource.title}" ${rating} stars.`,
      relatedId: resourceId
    });
  }

  res.status(201).json({ message: 'Rating saved.', rating: doc });
}

async function getResourceRatings(req, res) {
  const ratings = await Rating.find({ resourceId: req.params.resourceId })
    .populate('userId', 'name badge')
    .sort({ createdAt: -1 });

  const summary = {
    averageRating: ratings.length
      ? Number((ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length).toFixed(1))
      : 0,
    count: ratings.length
  };

  res.json({ ratings, summary });
}

async function getUserRating(req, res) {
  const rating = await Rating.findOne({ resourceId: req.params.resourceId, userId: req.user._id });
  res.json({ rating });
}

async function deleteRating(req, res) {
  await Rating.findOneAndDelete({ resourceId: req.params.resourceId, userId: req.user._id });
  await recalculateResourceRating(req.params.resourceId);
  res.json({ message: 'Rating removed.' });
}

async function getRatingHistory(req, res) {
  const ratings = await Rating.find({ userId: req.user._id })
    .populate('resourceId', 'title')
    .sort({ createdAt: -1 });

  res.json({ ratings });
}

module.exports = {
  createOrUpdateRating,
  getResourceRatings,
  getUserRating,
  deleteRating,
  getRatingHistory
};
