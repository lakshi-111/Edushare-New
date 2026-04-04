const Rating = require('../models/Rating');
const Resource = require('../models/Resource');
const User = require('../models/User');

function calculateRatingBadge(ratedResourceCount, averageRating) {
  if (ratedResourceCount < 3) return 'Unranked';
  if (ratedResourceCount >= 10 && averageRating >= 4.5) return 'Platinum';
  if (ratedResourceCount >= 8 && averageRating >= 4.0 && averageRating <= 4.4) return 'Gold';
  if (ratedResourceCount >= 5 && averageRating >= 3.0 && averageRating <= 3.9) return 'Silver';
  if (ratedResourceCount >= 3 && averageRating >= 1.0 && averageRating <= 2.9) return 'Bronze';
  return 'Unranked';
}

async function recalculateUploaderRating(uploaderId) {
  const resources = await Resource.find({ uploaderId }).select('_id');
  const resourceIds = resources.map((resource) => resource._id);

  if (!resourceIds.length) {
    await User.findByIdAndUpdate(uploaderId, { averageRating: 0, ratingBadge: 'Unranked' });
    return { averageRating: 0, ratedResourceCount: 0, ratingBadge: 'Unranked' };
  }

  const ratings = await Rating.find({ resourceId: { $in: resourceIds } }).select('resourceId rating');
  const ratedResourceIds = new Set();
  let totalStars = 0;
  let totalRatings = 0;

  for (const rating of ratings) {
    ratedResourceIds.add(rating.resourceId.toString());
    totalStars += rating.rating;
    totalRatings += 1;
  }

  const ratedResourceCount = ratedResourceIds.size;
  const averageRating = totalRatings ? Number((totalStars / totalRatings).toFixed(1)) : 0;
  const ratingBadge = calculateRatingBadge(ratedResourceCount, averageRating);

  await User.findByIdAndUpdate(uploaderId, { averageRating, ratingBadge });
  return { averageRating, ratedResourceCount, ratingBadge };
}

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

  await recalculateUploaderRating(resource.uploaderId);
  return resource;
}

module.exports = { recalculateResourceRating, recalculateUploaderRating, calculateRatingBadge };
