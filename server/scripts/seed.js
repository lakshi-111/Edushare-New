require('dotenv').config();
const { connectDatabase } = require('../utils/db');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Rating = require('../models/Rating');
const Comment = require('../models/Comment');
const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Connection = require('../models/Connection');

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    Rating.deleteMany({}),
    Comment.deleteMany({}),
    Inquiry.deleteMany({}),
    Notification.deleteMany({}),
    Order.deleteMany({}),
    Connection.deleteMany({})
  ]);

  const admin = await User.create({
    name: 'Prof. Davis',
    email: 'admin@edushare.com',
    password: 'Admin123',
    role: 'admin',
    badge: 'Gold'
  });

  const seller = await User.create({
    name: 'John Doe',
    email: 'nimali@example.com',
    password: 'Student123',
    role: 'student'
  });

  const buyer = await User.create({
    name: 'Buyer One',
    email: 'kasun@example.com',
    password: 'Student123',
    role: 'student'
  });

  const buyerTwo = await User.create({
    name: 'Buyer Two',
    email: 'buyer2@example.com',
    password: 'Student123',
    role: 'student'
  });

  const resources = await Resource.insertMany([
    {
      title: 'Introduction to Data Structures',
      description: 'Core notes on arrays, linked lists, stacks, queues, trees, and complexity analysis.',
      fileUrl: 'https://example.com/files/introduction-to-data-structures.pdf',
      fileName: 'introduction-to-data-structures.pdf',
      fileSize: 420000,
      fileType: 'pdf',
      category: 'Computer Science',
      faculty: 'Computer Science',
      academicYear: '2025/2026',
      semester: 'Semester 1',
      moduleCode: 'CS201',
      price: 15,
      tags: ['data structures', 'algorithms', 'revision'],
      uploaderId: seller._id,
      downloads: 234,
      averageRating: 4.5,
      ratingCount: 18,
      verificationStatus: 'paid',
      isApproved: true
    },
    {
      title: 'Calculus I Lecture Notes',
      description: 'Differentiation, integration, limits, series, and worked examples for first-year students.',
      fileUrl: 'https://example.com/files/calculus-lecture-notes.pdf',
      fileName: 'calculus-lecture-notes.pdf',
      fileSize: 380000,
      fileType: 'pdf',
      category: 'Mathematics',
      faculty: 'Mathematics',
      academicYear: '2025/2026',
      semester: 'Semester 1',
      moduleCode: 'MATH101',
      price: 0,
      tags: ['calculus', 'lecture notes'],
      uploaderId: seller._id,
      downloads: 456,
      averageRating: 4.8,
      ratingCount: 22,
      verificationStatus: 'verified',
      isApproved: true
    },
    {
      title: 'Organic Chemistry Study Guide',
      description: 'Reaction mechanisms, nomenclature, spectroscopy basics, and exam revision tips.',
      fileUrl: 'https://example.com/files/organic-chemistry-study-guide.pdf',
      fileName: 'organic-chemistry-study-guide.pdf',
      fileSize: 510000,
      fileType: 'pdf',
      category: 'Chemistry',
      faculty: 'Chemistry',
      academicYear: '2025/2026',
      semester: 'Semester 1',
      moduleCode: 'CHEM201',
      price: 20,
      tags: ['chemistry', 'organic', 'guide'],
      uploaderId: seller._id,
      downloads: 189,
      averageRating: 4.7,
      ratingCount: 12,
      verificationStatus: 'approved',
      isApproved: true
    },
    {
      title: 'Database Management Systems',
      description: 'Structured notes for normalization, SQL practice, concurrency control, and indexing.',
      fileUrl: 'https://example.com/files/database-management-systems.pdf',
      fileName: 'database-management-systems.pdf',
      fileSize: 490000,
      fileType: 'pdf',
      category: 'Computer Science',
      faculty: 'Computer Science',
      academicYear: '2025/2026',
      semester: 'Semester 1',
      moduleCode: 'CS301',
      price: 18,
      tags: ['database', 'sql', 'systems'],
      uploaderId: seller._id,
      downloads: 312,
      averageRating: 4.6,
      ratingCount: 16,
      verificationStatus: 'paid',
      isApproved: true
    },
    {
      title: 'Modern Physics Essentials',
      description: 'Quantum mechanics, relativity, and atomic physics concepts in a concise guide.',
      fileUrl: 'https://example.com/files/modern-physics-essentials.pdf',
      fileName: 'modern-physics-essentials.pdf',
      fileSize: 605000,
      fileType: 'pdf',
      category: 'Physics',
      faculty: 'Physics',
      academicYear: '2025/2026',
      semester: 'Semester 1',
      moduleCode: 'PHYS202',
      price: 0,
      tags: ['physics', 'modern', 'quantum'],
      uploaderId: seller._id,
      downloads: 567,
      averageRating: 4.9,
      ratingCount: 28,
      verificationStatus: 'pending',
      isApproved: true
    },
    {
      title: 'Financial Accounting Principles',
      description: 'Balance sheets, income statements, and cash flow analysis for quick revision.',
      fileUrl: 'https://example.com/files/financial-accounting-principles.pdf',
      fileName: 'financial-accounting-principles.pdf',
      fileSize: 450000,
      fileType: 'pdf',
      category: 'Business',
      faculty: 'Business',
      academicYear: '2025/2026',
      semester: 'Semester 1',
      moduleCode: 'BUS101',
      price: 12,
      tags: ['business', 'accounting'],
      uploaderId: seller._id,
      downloads: 201,
      averageRating: 4.4,
      ratingCount: 10,
      verificationStatus: 'verified',
      isApproved: true
    }
  ]);

  seller.uploadCount = resources.length;
  seller.totalDownloads = resources.reduce((sum, item) => sum + item.downloads, 0);
  seller.totalEarnings = 65;
  seller.updateBadge();
  admin.uploadCount = 0;
  admin.updateBadge();
  await Promise.all([seller.save(), admin.save(), buyer.save(), buyerTwo.save()]);

  await Rating.create([
    { resourceId: resources[0]._id, userId: buyer._id, rating: 5 },
    { resourceId: resources[2]._id, userId: buyerTwo._id, rating: 4 },
    { resourceId: resources[3]._id, userId: buyer._id, rating: 5 }
  ]);

  await Comment.create([
    { resourceId: resources[0]._id, userId: buyer._id, content: 'Very useful for revision before exams.' },
    { resourceId: resources[1]._id, userId: buyerTwo._id, content: 'Clear explanations and easy examples.' },
    { resourceId: resources[3]._id, userId: buyer._id, content: 'Great summary of joins and normalization.' }
  ]);

  await Inquiry.create({
    resourceId: resources[0]._id,
    userId: buyer._id,
    name: buyer.name,
    email: buyer.email,
    subject: 'Are there additional practice questions?',
    message: 'I need a few more stack and queue examples. Are they included?',
    status: 'Pending'
  });

  await Order.insertMany([
    {
      userId: buyer._id,
      items: [
        {
          resourceId: resources[0]._id,
          title: resources[0].title,
          price: resources[0].price,
          fileUrl: resources[0].fileUrl,
          fileName: resources[0].fileName
        }
      ],
      totalPrice: resources[0].price,
      status: 'completed',
      createdAt: new Date('2026-03-15T10:00:00.000Z'),
      updatedAt: new Date('2026-03-15T10:00:00.000Z')
    },
    {
      userId: buyerTwo._id,
      items: [
        {
          resourceId: resources[2]._id,
          title: resources[2].title,
          price: resources[2].price,
          fileUrl: resources[2].fileUrl,
          fileName: resources[2].fileName
        }
      ],
      totalPrice: resources[2].price,
      status: 'completed',
      createdAt: new Date('2026-03-18T10:00:00.000Z'),
      updatedAt: new Date('2026-03-18T10:00:00.000Z')
    },
    {
      userId: buyer._id,
      items: [
        {
          resourceId: resources[3]._id,
          title: resources[3].title,
          price: resources[3].price,
          fileUrl: resources[3].fileUrl,
          fileName: resources[3].fileName
        }
      ],
      totalPrice: resources[3].price,
      status: 'completed',
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z')
    },
    {
      userId: buyerTwo._id,
      items: [
        {
          resourceId: resources[5]._id,
          title: resources[5].title,
          price: resources[5].price,
          fileUrl: resources[5].fileUrl,
          fileName: resources[5].fileName
        }
      ],
      totalPrice: resources[5].price,
      status: 'completed',
      createdAt: new Date('2026-03-17T10:00:00.000Z'),
      updatedAt: new Date('2026-03-17T10:00:00.000Z')
    },
    {
      userId: buyer._id,
      items: [
        {
          resourceId: resources[1]._id,
          title: resources[1].title,
          price: resources[1].price,
          fileUrl: resources[1].fileUrl,
          fileName: resources[1].fileName
        }
      ],
      totalPrice: resources[1].price,
      status: 'completed',
      createdAt: new Date('2026-03-19T10:00:00.000Z'),
      updatedAt: new Date('2026-03-19T10:00:00.000Z')
    }
  ]);

  console.log('✅ Seed complete');
  console.log('Admin login: admin@edushare.com / Admin123');
  console.log('Student login: nimali@example.com / Student123');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
