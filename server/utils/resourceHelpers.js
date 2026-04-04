const Rating = require('../models/Rating');
const Resource = require('../models/Resource');
const User = require('../models/User');

async function recalculateResourceRating(resourceId) {
  const ratings = await Rating.find({ resourceId });
  const ratingCount = ratings.length;
  const averageRating = ratingCount
    ? Number((ratings.reduce((sum, item) => sum + item.rating, 0) / ratingCount).toFixed(1))
    : 0;

  const resource = await Resource.findByIdAndUpdate(
    resourceId,
    { averageRating, ratingCount },
    { new: true }
  );

  if (!resource) return null;

  const resources = await Resource.find({ uploaderId: resource.uploaderId });
  const uploaderAverage = resources.length
    ? Number((resources.reduce((sum, item) => sum + (item.averageRating || 0), 0) / resources.length).toFixed(1))
    : 0;

  await User.findByIdAndUpdate(resource.uploaderId, { averageRating: uploaderAverage });
  return resource;
}

module.exports = { recalculateResourceRating };
