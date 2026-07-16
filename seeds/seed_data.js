require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Fabric = require('../models/Fabric');
const PageContent = require('../models/PageContent');
const SiteSettings = require('../models/SiteSettings');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/el_attire');
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Fabric.deleteMany({}),
      PageContent.deleteMany({}),
      SiteSettings.deleteMany({})
    ]);

    // Create Super Admin
    const superAdmin = await User.create({
      phone: '+2348000000000',
      email: 'admin@elattire.com',
      password: 'admin123456',
      firstName: 'Admin',
      lastName: 'Ogunlesi',
      role: 'superadmin',
      isActive: true
    });
    console.log('Super admin created');

    // Create sample tailor
    const tailor = await User.create({
      phone: '+2348012345678',
      email: 'tailor@elattire.com',
      password: 'tailor123',
      firstName: 'Adebayo',
      lastName: 'Master',
      role: 'tailor',
      isActive: true
    });

    // Create sample customer
    const customer = await User.create({
      phone: '+2348123456789',
      email: 'customer@email.com',
      password: 'password123',
      firstName: 'Oluwaseun',
      lastName: 'Adebayo',
      role: 'customer',
      isActive: true
    });

    // Create sample products
    const products = await Product.insertMany([
      {
        name: 'Royal Blue Kaftan',
        category: 'kaftan',
        price: 245000,
        description: 'Handcrafted royal blue Kaftan with intricate embroidery.',
        images: [{ url: '/uploads/kaftan-1.jpg', alt: 'Royal Blue Kaftan', isMain: true }],
        sizes: [{ label: 'S' }, { label: 'M' }, { label: 'L' }, { label: 'XL' }],
        tags: ['premium', 'wedding'],
        badge: { text: 'Bestseller', type: 'bestseller' },
        isFeatured: true,
        createdBy: superAdmin._id
      },
      {
        name: 'Embroidered Agbada Set',
        category: 'agbada',
        price: 380000,
        description: 'Full Agbada set in cream with gold embroidery.',
        images: [{ url: '/uploads/agbada-1.jpg', alt: 'Agbada Set', isMain: true }],
        sizes: [{ label: 'M' }, { label: 'L' }, { label: 'XL' }, { label: 'XXL' }],
        tags: ['exclusive', 'wedding'],
        badge: { text: 'Limited', type: 'limited' },
        isFeatured: true,
        createdBy: superAdmin._id
      }
    ]);
    console.log('Sample products created');

    // Create sample fabrics
    const fabrics = await Fabric.insertMany([
      {
        name: 'Royal Blue Aso Oke',
        category: 'aso-oke',
        price: 120000,
        unit: 'yd',
        description: 'Handwoven premium Aso Oke with metallic thread accents.',
        images: [{ url: '/uploads/fabric-1.jpg', alt: 'Royal Blue Aso Oke', isMain: true }],
        specifications: { width: '45"', composition: 'Cotton / Metallic Thread', weight: '280 gsm', care: 'Dry Clean' },
        tags: ['premium', 'heritage'],
        badge: { text: 'Bestseller', type: 'bestseller' },
        isFeatured: true,
        createdBy: superAdmin._id
      }
    ]);
    console.log('Sample fabrics created');

    // Create site settings
    await SiteSettings.create({});
    console.log('Site settings created');

    // Create page content for all public pages
    const pages = ['home', 'about', 'collection', 'fabrics', 'tailoring', 'lookbook', 'contact', 'faq', 'terms'];
    for (const page of pages) {
      await PageContent.create({
        page,
        title: page.charAt(0).toUpperCase() + page.slice(1),
        isPublished: true,
        lastModifiedBy: superAdmin._id
      });
    }
    console.log('Page content created for all pages');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();