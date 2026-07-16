const Fabric = require('../models/Fabric');
const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');

// Public: Fabric detail
exports.fabricDetail = async (req, res) => {
  try {
    const fabric = await Fabric.findOne({ slug: req.params.slug, isActive: true });
    
    if (!fabric) {
      req.session.error = 'Fabric not found';
      return res.redirect('/fabrics');
    }

    const relatedFabrics = await Fabric.find({
      category: fabric.category,
      _id: { $ne: fabric._id },
      isActive: true
    }).limit(4);

    res.render('public/fabric-detail', {
      title: fabric.name,
      fabric,
      relatedFabrics,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('public/500', { title: 'Server Error' });
  }
};

// Admin: List fabrics
exports.adminList = async (req, res) => {
  try {
    const { category, page: pageNum } = req.query;
    const page = parseInt(pageNum) || 1;
    const limit = 20;

    let query = {};
    if (category && category !== 'all') query.category = category;

    const fabrics = await Fabric.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Fabric.countDocuments(query);

    res.render('admin/fabrics', {
      title: 'Manage Fabrics',
      fabrics,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      filterCategory: category || 'all',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('admin/500', { title: 'Server Error' });
  }
};

// Admin: Create fabric
exports.create = async (req, res) => {
  try {
    const fabricData = { ...req.body, createdBy: req.session.user._id };

    if (req.files?.length) {
      fabricData.images = req.files.map((f, i) => ({
        url: `/uploads/${f.filename}`,
        alt: req.body.name,
        isMain: i === 0
      }));
    }

    const fabric = await Fabric.create(fabricData);
    req.session.success = 'Fabric added successfully';
    res.redirect('/admin/fabrics');
  } catch (error) {
    console.error(error);
    req.session.error = 'Error adding fabric';
    res.redirect('/admin/fabrics/create');
  }
};

// Admin: Update fabric
exports.update = async (req, res) => {
  try {
    const fabric = await Fabric.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.session.success = 'Fabric updated';
    res.redirect('/admin/fabrics');
  } catch (error) {
    console.error(error);
    req.session.error = 'Error updating fabric';
    res.redirect('/admin/fabrics');
  }
};

// Admin: Delete fabric
exports.delete = async (req, res) => {
  try {
    await Fabric.findByIdAndDelete(req.params.id);
    req.session.success = 'Fabric deleted';
    res.redirect('/admin/fabrics');
  } catch (error) {
    console.error(error);
    req.session.error = 'Error deleting fabric';
    res.redirect('/admin/fabrics');
  }
};