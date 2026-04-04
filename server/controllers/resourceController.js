const Rating = require('../models/Rating');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { recalculateUploaderRating } = require('../utils/resourceHelpers');

function resourceQueryFromReq(query) {
  const q = { isPublic: true, isApproved: { $ne: false } };
  if (query.category) q.category = query.category;
  if (query.faculty) q.faculty = query.faculty;
  if (query.academicYear) q.academicYear = query.academicYear;
  if (query.semester) q.semester = query.semester;
  if (query.moduleCode) q.moduleCode = query.moduleCode;
  if (query.search) {
    q.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
      { faculty: { $regex: query.search, $options: 'i' } },
      { moduleCode: { $regex: query.search, $options: 'i' } },
      { tags: { $elemMatch: { $regex: query.search, $options: 'i' } } }
    ];
  }
  return q;
}

async function getResources(req, res) {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 12), 50);
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const query = resourceQueryFromReq(req.query);
  const total = await Resource.countDocuments(query);
  const resources = await Resource.find(query)
    .populate('uploaderId', 'name email badge ratingBadge')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  res.json({
    resources,
    pagination: {
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
      limit
    }
  });
}

async function getResourceById(req, res) {
  const resource = await Resource.findById(req.params.id).populate('uploaderId', 'name email badge ratingBadge');
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  res.json({ resource });
}

async function createResource(req, res) {
  const resource = await Resource.create({
    ...req.body,
    uploaderId: req.user._id,
    semester: req.body.semester || 'Semester 1',
    moduleCode: String(req.body.moduleCode || '').trim().toUpperCase(),
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    verificationStatus: 'pending',
    verificationNotes: '',
    isApproved: true
  });

  req.user.uploadCount += 1;
  req.user.updateBadge();
  await req.user.save();

  const populated = await Resource.findById(resource._id).populate('uploaderId', 'name email badge ratingBadge');
  res.status(201).json({ message: 'Resource created successfully.', resource: populated });
}

async function updateResource(req, res) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  if (resource.uploaderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You cannot edit this resource.' });
  }

  const updates = { ...req.body };

  if (req.user.role !== 'admin') {
    delete updates.verificationStatus;
    delete updates.verificationNotes;
    delete updates.isApproved;
    delete updates.isPublic;
  }

  if (typeof updates.moduleCode === 'string') {
    updates.moduleCode = updates.moduleCode.trim().toUpperCase();
  }

  Object.assign(resource, updates);

  if (req.user.role === 'admin' && updates.verificationStatus) {
    resource.isApproved = updates.verificationStatus !== 'rejected';
  }

  await resource.save();
  const populated = await Resource.findById(resource._id).populate('uploaderId', 'name email badge ratingBadge');
  res.json({ message: 'Resource updated.', resource: populated });
}

async function deleteResource(req, res) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  if (resource.uploaderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You cannot delete this resource.' });
  }

  await Rating.deleteMany({ resourceId: resource._id });
  await resource.deleteOne();

  const owner = await User.findById(resource.uploaderId);
  if (owner) {
    owner.uploadCount = Math.max(0, owner.uploadCount - 1);
    owner.updateBadge();
    await owner.save();
    await recalculateUploaderRating(owner._id);
  }

  res.json({ message: 'Resource deleted.' });
}

async function downloadResource(req, res) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  if (req.user) {
    const existingOrder = await Order.findOne({
      userId: req.user._id,
      'items.resourceId': resource._id
    });

    if (resource.price > 0 && !existingOrder && resource.uploaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Purchase this resource before downloading.' });
    }
  }

  resource.downloads += 1;
  await resource.save();

  await User.findByIdAndUpdate(resource.uploaderId, { $inc: { totalDownloads: 1 } });

  res.json({ message: 'Download recorded.', fileUrl: resource.fileUrl, fileName: resource.fileName });
}

async function getMyResources(req, res) {
  const resources = await Resource.find({ uploaderId: req.user._id })
    .populate('uploaderId', 'name email badge ratingBadge')
    .sort({ updatedAt: -1, createdAt: -1 });

  res.json({ resources });
}

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  getMyResources
};
