const PageContent = require('../models/PageContent');
const SiteSettings = require('../models/SiteSettings');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Fabric = require('../models/Fabric');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Tailoring = require('../models/Tailoring');
const Invoice = require('../models/Invoice');
const Media = require('../models/Media');
const Activity = require('../models/Activity');

class AdminController {

  // ============ DASHBOARD ============

  async getDashboard(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      // Comprehensive dashboard stats
      const [
        revenueStats,
        orderStats,
        tailoringStats,
        customerStats,
        appointmentStats,
        fabricStats,
        reviewStats,
        revenueChart,
        orderStatusBreakdown,
        topProducts,
        topCustomers,
        recentActivities,
        pendingTasks
      ] = await Promise.all([
        // Revenue statistics
        this.getRevenueStats(thisMonth, lastMonth),
        // Order statistics
        this.getOrderStats(thisMonth, lastMonth),
        // Tailoring statistics
        this.getTailoringStats(),
        // Customer statistics
        this.getCustomerStats(thisMonth),
        // Appointment statistics
        this.getAppointmentStats(today),
        // Fabric inventory stats
        this.getFabricStats(),
        // Review statistics
        this.getReviewStats(),
        // Revenue chart data (last 30 days)
        this.getRevenueChartData(30),
        // Order status breakdown
        this.getOrderStatusBreakdown(),
        // Top selling products
        this.getTopProducts(5),
        // Top customers
        this.getTopCustomers(5),
        // Recent activities
        this.getRecentActivities(10),
        // Pending tasks
        this.getPendingTasks()
      ]);

      // Page view stats (last 7 days)
      const pageViews = await this.getPageViewStats(7);

      // Conversion rate
      const conversionRate = customerStats.totalVisitors > 0
        ? ((orderStats.totalThisMonth / customerStats.totalVisitors) * 100).toFixed(2)
        : 0;

      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        revenueStats,
        orderStats,
        tailoringStats,
        customerStats,
        appointmentStats,
        fabricStats,
        reviewStats,
        revenueChart,
        orderStatusBreakdown,
        topProducts,
        topCustomers,
        recentActivities,
        pendingTasks,
        pageViews,
        conversionRate,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Dashboard Error:', error);
      res.status(500).render('admin/500', { title: 'Server Error', layout: 'layouts/admin' });
    }
  }

  // ============ STATS HELPERS ============

  async getRevenueStats(thisMonth, lastMonth) {
    const [thisMonthRevenue, lastMonthRevenue, totalRevenue, pendingPayments, paidToday] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonth, $lt: thisMonth }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { $match: { 'payment.status': { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$pricing.total', '$payment.amountPaid'] } }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { 'payment.paidAt': { $gte: new Date().setHours(0,0,0,0) } } },
        { $group: { _id: null, total: { $sum: '$payment.amountPaid' } } }
      ])
    ]);

    const thisMonthTotal = thisMonthRevenue[0]?.total || 0;
    const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
    const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

    return {
      thisMonth: thisMonthTotal,
      thisMonthCount: thisMonthRevenue[0]?.count || 0,
      lastMonth: lastMonthTotal,
      totalRevenue: totalRevenue[0]?.total || 0,
      growth: parseFloat(growth),
      pendingPayments: pendingPayments[0]?.total || 0,
      pendingCount: pendingPayments[0]?.count || 0,
      paidToday: paidToday[0]?.total || 0
    };
  }

  async getOrderStats(thisMonth, lastMonth) {
    const [total, thisMonthCount, lastMonthCount, byStatus] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    return {
      total,
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
      growth: lastMonthCount > 0 ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1) : 0,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
    };
  }

  async getTailoringStats() {
    const [active, completed, byStage, averageCompletion] = await Promise.all([
      Tailoring.countDocuments({ status: { $in: ['confirmed', 'in_progress', 'fitting'] } }),
      Tailoring.countDocuments({ status: 'completed' }),
      Tailoring.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, avgProgress: { $avg: '$progress' } } }]),
      Tailoring.aggregate([
        { $match: { status: 'completed', actualCompletionDate: { $exists: true } } },
        { $project: { days: { $divide: [{ $subtract: ['$actualCompletionDate', '$createdAt'] }, 86400000] } } },
        { $group: { _id: null, avg: { $avg: '$days' } } }
      ])
    ]);

    return {
      active,
      completed,
      byStage: byStage.reduce((acc, s) => ({ ...acc, [s._id]: s }), {}),
      avgCompletionDays: Math.round(averageCompletion[0]?.avg || 0)
    };
  }

  async getCustomerStats(thisMonth) {
    const [total, newThisMonth, active, totalVisitors] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: thisMonth } }),
      User.countDocuments({ role: 'customer', lastLogin: { $gte: new Date(Date.now() - 30*86400000) } }),
      3247 // This would come from analytics
    ]);

    return { total, newThisMonth, active, totalVisitors };
  }

  async getAppointmentStats(today) {
    const [todayCount, upcoming, pending, completed] = await Promise.all([
      Appointment.countDocuments({ date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } }),
      Appointment.countDocuments({ date: { $gte: today }, status: 'confirmed' }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' })
    ]);

    return { today: todayCount, upcoming, pending, completed };
  }

  async getFabricStats() {
    const [total, lowStock, outOfStock, categories] = await Promise.all([
      Fabric.countDocuments({ isActive: true }),
      Fabric.countDocuments({ 'inventory.quantity': { $gt: 0, $lte: 10 } }),
      Fabric.countDocuments({ 'inventory.quantity': 0 }),
      Fabric.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } }])
    ]);

    return { total, lowStock, outOfStock, categories };
  }

  async getReviewStats() {
    const [total, approved, pending, averageRating, recent] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ isApproved: true }),
      Review.countDocuments({ isApproved: false }),
      Review.aggregate([{ $match: { isApproved: true } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Review.find({ isApproved: false }).sort('-createdAt').limit(5).populate('user', 'firstName lastName').lean()
    ]);

    return { total, approved, pending, averageRating: averageRating[0]?.avg || 0, pendingReviews: recent };
  }

  async getRevenueChartData(days) {
    const startDate = new Date(Date.now() - days * 86400000);
    
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, 'payment.status': 'paid' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$pricing.total' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    const labels = [];
    const values = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const found = data.find(d => d._id === dateStr);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values.push(found ? found.total : 0);
    }

    return { labels, values };
  }

  async getOrderStatusBreakdown() {
    return await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getTopProducts(limit) {
    return await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.product': { $exists: true }, status: { $in: ['delivered', 'completed'] } } },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', slug: '$product.slug', totalSold: 1, revenue: 1 } }
    ]);
  }

  async getTopCustomers(limit) {
    return await Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: '$user', totalSpent: { $sum: '$pricing.total' }, orderCount: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, phone: '$user.phone', totalSpent: 1, orderCount: 1 } }
    ]);
  }

  async getRecentActivities(limit) {
    return await Activity.find()
      .sort('-createdAt')
      .limit(limit)
      .populate('user', 'firstName lastName')
      .lean();
  }

  async getPendingTasks() {
    const [pendingOrders, pendingReviews, lowStockFabrics, upcomingAppointments, overdueInvoices] = await Promise.all([
      Order.countDocuments({ status: 'pending' }),
      Review.countDocuments({ isApproved: false }),
      Fabric.find({ 'inventory.quantity': { $lte: 10 }, isActive: true }).select('name inventory.quantity').lean(),
      Appointment.find({ date: { $gte: new Date() }, status: 'pending' }).countDocuments(),
      Invoice.countDocuments({ status: 'overdue' })
    ]);

    return { pendingOrders, pendingReviews, lowStockFabrics, upcomingAppointments, overdueInvoices };
  }

  async getPageViewStats(days) {
    // This would integrate with Google Analytics or internal tracking
    const labels = [];
    const values = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      values.push(Math.floor(Math.random() * 500) + 300); // Mock data
    }
    return { labels, values };
  }

  // ============ PAGE CONTENT MANAGEMENT ============

  async getPages(req, res) {
    try {
      const pages = await PageContent.find()
        .sort('page')
        .populate('lastModifiedBy', 'firstName lastName')
        .lean();

      // Get page stats
      const pageStats = await Promise.all(pages.map(async (page) => {
        const sectionCount = page.sections?.length || 0;
        const productCount = page.products?.length || 0;
        const fabricCount = page.fabrics?.length || 0;
        return { ...page, sectionCount, productCount, fabricCount };
      }));

      res.render('admin/pages/list', {
        title: 'Manage Pages',
        pages: pageStats,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Get Pages Error:', error);
      res.status(500).render('admin/500', { title: 'Server Error', layout: 'layouts/admin' });
    }
  }

  async getEditPage(req, res) {
    try {
      const page = await PageContent.findById(req.params.id)
        .populate('products', 'name slug price')
        .populate('fabrics', 'name category price')
        .lean();

      if (!page) {
        req.session.error = 'Page not found';
        return res.redirect('/admin/pages');
      }

      const [allProducts, allFabrics, mediaLibrary] = await Promise.all([
        Product.find({ isActive: true }).select('name slug price images').lean(),
        Fabric.find({ isActive: true }).select('name category price images').lean(),
        Media.find().sort('-createdAt').limit(50).lean()
      ]);

      // Get available section types
      const sectionTypes = [
        { value: 'hero', label: 'Hero Banner' },
        { value: 'fullBleed', label: 'Full Bleed Image' },
        { value: 'grid', label: 'Image Grid' },
        { value: 'carousel', label: 'Carousel' },
        { value: 'video', label: 'Video Section' },
        { value: 'testimonial', label: 'Testimonials' },
        { value: 'cta', label: 'Call to Action' },
        { value: 'contact', label: 'Contact Form' },
        { value: 'text', label: 'Text Block' },
        { value: 'fabricTabs', label: 'Fabric Tabs' },
        { value: 'modelShowcase', label: 'Model Showcase' },
        { value: 'process', label: 'Process Steps' },
        { value: 'tiers', label: 'Pricing Tiers' },
        { value: 'faq', label: 'FAQ Accordion' },
        { value: 'timeline', label: 'Timeline' },
        { value: 'stats', label: 'Statistics' }
      ];

      res.render('admin/pages/edit', {
        title: `Edit ${page.page} Page`,
        page,
        allProducts,
        allFabrics,
        mediaLibrary,
        sectionTypes,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Edit Page Error:', error);
      res.status(500).render('admin/500', { title: 'Server Error', layout: 'layouts/admin' });
    }
  }

  async updatePage(req, res) {
    try {
      const page = await PageContent.findById(req.params.id);
      if (!page) {
        req.session.error = 'Page not found';
        return res.redirect('/admin/pages');
      }

      // Update basic fields
      page.title = req.body.title;
      page.metaDescription = req.body.metaDescription;
      page.seoTitle = req.body.seoTitle;
      page.seoKeywords = req.body.seoKeywords ? req.body.seoKeywords.split(',').map(k => k.trim()) : [];
      page.isPublished = req.body.isPublished === 'on';
      page.lastModifiedBy = req.session.user._id;

      // Update hero section
      if (req.body.heroSection) {
        page.heroSection = {
          enabled: req.body.heroSectionEnabled === 'on',
          headline: req.body.heroHeadline,
          subheadline: req.body.heroSubheadline,
          backgroundImages: req.body.heroBackgroundImages ? 
            (Array.isArray(req.body.heroBackgroundImages) ? req.body.heroBackgroundImages : [req.body.heroBackgroundImages]) : [],
          ctaText: req.body.heroCtaText,
          ctaLink: req.body.heroCtaLink,
          secondaryCtaText: req.body.heroSecondaryCtaText,
          secondaryCtaLink: req.body.heroSecondaryCtaLink,
          overlayOpacity: parseFloat(req.body.heroOverlayOpacity) || 0.35
        };
      }

      // Update sections (JSON from the form builder)
      if (req.body.sections) {
        try {
          page.sections = typeof req.body.sections === 'string' 
            ? JSON.parse(req.body.sections) 
            : req.body.sections;
        } catch (e) {
          req.session.error = 'Invalid sections data';
          return res.redirect(`/admin/pages/${req.params.id}/edit`);
        }
      }

      // Update associated products and fabrics
      if (req.body.products) {
        page.products = Array.isArray(req.body.products) ? req.body.products : [req.body.products];
      }
      if (req.body.fabrics) {
        page.fabrics = Array.isArray(req.body.fabrics) ? req.body.fabrics : [req.body.fabrics];
      }

      await page.save();

      await this.logActivity(req, 'update', 'page', page._id, `Updated page: ${page.page}`);

      req.session.success = `${page.page} page updated successfully`;
      res.redirect('/admin/pages');
    } catch (error) {
      console.error('Update Page Error:', error);
      req.session.error = 'Error updating page';
      res.redirect(`/admin/pages/${req.params.id}/edit`);
    }
  }

  async previewPage(req, res) {
    try {
      const page = await PageContent.findById(req.params.id)
        .populate('products')
        .populate('fabrics')
        .lean();

      if (!page) {
        return res.status(404).send('Page not found');
      }

      const settings = await SiteSettings.findOne();
      res.render(`public/${page.page}`, {
        title: page.title,
        settings,
        pageContent: page,
        isPreview: true,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Preview Error:', error);
      res.status(500).send('Preview error');
    }
  }

  // ============ SITE SETTINGS ============

  async getSettings(req, res) {
    try {
      let settings = await SiteSettings.findOne().lean();
      if (!settings) {
        settings = await SiteSettings.create({});
        settings = settings.toObject();
      }

      res.render('admin/settings', {
        title: 'Site Settings',
        settings,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Settings Error:', error);
      res.status(500).render('admin/500', { title: 'Server Error', layout: 'layouts/admin' });
    }
  }

  async updateSettings(req, res) {
    try {
      let settings = await SiteSettings.findOne();
      if (!settings) settings = new SiteSettings();

      // Update branding
      if (req.body.branding) {
        Object.keys(req.body.branding).forEach(key => {
          if (settings.branding[key] !== undefined) {
            settings.branding[key] = req.body.branding[key];
          }
        });
        settings.markModified('branding');
      }

      // Update contact
      if (req.body.contact) {
        Object.keys(req.body.contact).forEach(key => {
          if (key === 'socialMedia' && req.body.contact.socialMedia) {
            Object.keys(req.body.contact.socialMedia).forEach(sm => {
              settings.contact.socialMedia[sm] = req.body.contact.socialMedia[sm];
            });
          } else if (settings.contact[key] !== undefined) {
            settings.contact[key] = req.body.contact[key];
          }
        });
        settings.markModified('contact');
      }

      // Update business
      if (req.body.business) {
        Object.keys(req.body.business).forEach(key => {
          if (settings.business[key] !== undefined) {
            settings.business[key] = req.body.business[key];
          }
        });
        settings.markModified('business');
      }

      // Update SEO
      if (req.body.seo) {
        Object.keys(req.body.seo).forEach(key => {
          if (settings.seo[key] !== undefined) {
            settings.seo[key] = req.body.seo[key];
          }
        });
        settings.markModified('seo');
      }

      // Update features
      if (req.body.features) {
        settings.features = {
          ...settings.features,
          enableReviews: req.body.features.enableReviews === 'on',
          enableWishlist: req.body.features.enableWishlist === 'on',
          enableNewsletter: req.body.features.enableNewsletter === 'on',
          enableLiveChat: req.body.features.enableLiveChat === 'on',
          maintenanceMode: req.body.features.maintenanceMode === 'on'
        };
      }

      // Handle logo uploads
      if (req.files) {
        if (req.files['logoDark']) {
          settings.branding.logoDark = `/uploads/${req.files['logoDark'][0].filename}`;
        }
        if (req.files['logoLight']) {
          settings.branding.logoLight = `/uploads/${req.files['logoLight'][0].filename}`;
        }
        if (req.files['logoOnly']) {
          settings.branding.logoOnly = `/uploads/${req.files['logoOnly'][0].filename}`;
        }
        if (req.files['favicon']) {
          settings.branding.favicon = `/uploads/${req.files['favicon'][0].filename}`;
        }
      }

      await settings.save();
      await this.logActivity(req, 'update', 'settings', settings._id, 'Updated site settings');

      req.session.success = 'Settings updated successfully';
      res.redirect('/admin/settings');
    } catch (error) {
      console.error('Update Settings Error:', error);
      req.session.error = 'Error updating settings';
      res.redirect('/admin/settings');
    }
  }

  // ============ MEDIA LIBRARY ============

  async getMedia(req, res) {
    try {
      const { folder, type, search, page = 1 } = req.query;
      const limit = 48;
      const skip = (parseInt(page) - 1) * limit;

      let query = {};
      if (folder && folder !== 'all') query.folder = folder;
      if (type === 'image') query.mimeType = /^image/;
      if (type === 'video') query.mimeType = /^video/;
      if (search) {
        query.$or = [
          { originalName: { $regex: search, $options: 'i' } },
          { alt: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }

      const [media, total, folders] = await Promise.all([
        Media.find(query).sort('-createdAt').skip(skip).limit(limit).lean(),
        Media.countDocuments(query),
        Media.distinct('folder')
      ]);

      res.render('admin/media', {
        title: 'Media Library',
        media,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalFiles: total,
        folders: ['all', ...folders],
        currentFolder: folder || 'all',
        currentType: type || 'all',
        search: search || '',
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Media Error:', error);
      res.status(500).render('admin/500', { title: 'Server Error', layout: 'layouts/admin' });
    }
  }

  async uploadMedia(req, res) {
    try {
      if (!req.files?.length) {
        req.session.error = 'Please select files to upload';
        return res.redirect('/admin/media');
      }

      const folder = req.body.folder || 'general';
      const uploads = await Promise.all(req.files.map(async (file) => {
        let thumbnailUrl = null;
        
        if (file.mimetype.startsWith('image/')) {
          const thumbPath = file.path.replace(/(\.[\w]+)$/, '-thumb$1');
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbPath);
          thumbnailUrl = `/uploads/${path.basename(thumbPath)}`;
        }

        return Media.create({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          thumbnailUrl,
          folder,
          alt: req.body.alt || file.originalname,
          tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
          uploadedBy: req.session.user._id
        });
      }));

      await this.logActivity(req, 'upload', 'media', null, `Uploaded ${uploads.length} file(s)`);

      req.session.success = `${uploads.length} file(s) uploaded successfully`;
      res.redirect('/admin/media');
    } catch (error) {
      console.error('Upload Error:', error);
      req.session.error = 'Error uploading files';
      res.redirect('/admin/media');
    }
  }

  async deleteMedia(req, res) {
    try {
      const media = await Media.findById(req.params.id);
      if (!media) {
        req.session.error = 'File not found';
        return res.redirect('/admin/media');
      }

      // Delete physical files
      const filesToDelete = [media.url, media.thumbnailUrl].filter(Boolean);
      for (const fileUrl of filesToDelete) {
        const filePath = path.join(__dirname, '..', 'public', fileUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await Media.findByIdAndDelete(req.params.id);
      await this.logActivity(req, 'delete', 'media', req.params.id, `Deleted file: ${media.originalName}`);

      req.session.success = 'File deleted';
      res.redirect('/admin/media');
    } catch (error) {
      console.error('Delete Media Error:', error);
      req.session.error = 'Error deleting file';
      res.redirect('/admin/media');
    }
  }

  // ============ HELPER ============

  async logActivity(req, action, model, modelId, description) {
    try {
      await Activity.create({
        user: req.session.user._id,
        action,
        model,
        modelId,
        description,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (error) {
      console.error('Activity Log Error:', error);
    }
  }
}

module.exports = new AdminController();