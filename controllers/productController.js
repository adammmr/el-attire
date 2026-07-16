const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Media = require('../models/Media');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ProductController {

  // ============ PUBLIC METHODS ============

  // Get single product detail with all related data
  async getProductDetail(req, res) {
    try {
      const product = await Product.findOne({ 
        slug: req.params.slug, 
        isActive: true 
      }).lean();

      if (!product) {
        req.session.error = 'Product not found';
        return res.redirect('/collection');
      }

      // Get related products (same category, exclude current)
      const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: true
      }).limit(8).select('name slug price images badge category').lean();

      // Get product reviews
      const reviews = await Review.find({
        product: product._id,
        isApproved: true
      })
      .populate('user', 'firstName lastName profileImage')
      .sort('-createdAt')
      .limit(10)
      .lean();

      // Calculate rating distribution
      const ratingDistribution = await Review.aggregate([
        { $match: { product: product._id, isApproved: true } },
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ]);

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingDistribution.forEach(r => { distribution[r._id] = r.count; });

      // Get purchase count
      const purchaseCount = await Order.countDocuments({
        'items.product': product._id,
        status: { $in: ['delivered', 'completed'] }
      });

      // Get view count (from session or tracking)
      const viewKey = `product_view_${product._id}`;
      if (!req.session[viewKey]) {
        req.session[viewKey] = true;
        await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });
      }

      // Get recently viewed products from session
      let recentlyViewed = [];
      if (req.session.recentlyViewed) {
        recentlyViewed = await Product.find({
          _id: { $in: req.session.recentlyViewed, $ne: product._id },
          isActive: true
        }).limit(4).select('name slug price images').lean();
      }

      // Add to recently viewed
      if (!req.session.recentlyViewed) req.session.recentlyViewed = [];
      req.session.recentlyViewed = [
        product._id,
        ...req.session.recentlyViewed.filter(id => id.toString() !== product._id.toString())
      ].slice(0, 10);

      // Get available sizes with stock info
      const sizeAvailability = product.sizes.map(size => ({
        ...size,
        inStock: size.isAvailable
      }));

      // Get color variants
      const colorVariants = await Product.find({
        name: product.name,
        _id: { $ne: product._id },
        isActive: true
      }).select('colors images price').lean();

      // Get complementary products (different category, same occasion)
      const complementaryProducts = await Product.find({
        category: { $ne: product.category },
        'styling.occasion': { $in: product.styling?.occasion || [] },
        isActive: true
      }).limit(4).select('name slug price images badge').lean();

      // Get fabric suggestions if product has fabric info
      let suggestedFabrics = [];
      if (product.fabric?.name) {
        const Fabric = require('../models/Fabric');
        suggestedFabrics = await Fabric.find({
          isActive: true,
          $or: [
            { name: { $regex: product.fabric.name, $options: 'i' } },
            { category: product.category === 'kaftan' ? 'aso-oke' : 'damask' }
          ]
        }).limit(4).select('name slug price images category').lean();
      }

      // Check if in user's wishlist
      let isWishlisted = false;
      if (req.session.user) {
        const user = await User.findById(req.session.user._id).select('wishlist');
        isWishlisted = user?.wishlist?.some(id => id.toString() === product._id.toString()) || false;
      }

      // Get active promotions/discounts
      const activePromotions = [];
      if (product.badge?.type === 'sale') {
        activePromotions.push({
          type: 'sale',
          label: 'On Sale',
          discount: product.discountPercentage || 10
        });
      }

      // SEO data
      const seoData = {
        title: product.metaTitle || `${product.name} - EL-ATTIRE`,
        description: product.metaDescription || product.shortDescription || product.description?.substring(0, 160),
        keywords: product.metaKeywords?.join(', ') || `${product.category}, ${product.tags?.join(', ')}, nigerian tailoring`,
        ogImage: product.images?.[0]?.url || '/uploads/default-product.jpg'
      };

      res.render('public/product-detail', {
        title: seoData.title,
        product,
        relatedProducts,
        reviews,
        ratingDistribution,
        purchaseCount,
        recentlyViewed,
        sizeAvailability,
        colorVariants,
        complementaryProducts,
        suggestedFabrics,
        isWishlisted,
        activePromotions,
        seoData,
        layout: 'layouts/main'
      });

    } catch (error) {
      console.error('Product Detail Error:', error);
      req.session.error = 'Error loading product details';
      res.redirect('/collection');
    }
  }

  // Quick view (AJAX)
  async quickView(req, res) {
    try {
      const product = await Product.findById(req.params.id)
        .select('name price images sizes colors description badge category tags')
        .lean();

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ success: true, product });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Search products
  async search(req, res) {
    try {
      const { q, category, minPrice, maxPrice, sort, page = 1 } = req.query;
      const limit = 24;
      const skip = (parseInt(page) - 1) * limit;

      let query = { isActive: true };

      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ];
      }

      if (category && category !== 'all') {
        query.category = category;
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseInt(minPrice);
        if (maxPrice) query.price.$lte = parseInt(maxPrice);
      }

      let sortOption = { createdAt: -1 };
      if (sort === 'price-asc') sortOption = { price: 1 };
      if (sort === 'price-desc') sortOption = { price: -1 };
      if (sort === 'name-asc') sortOption = { name: 1 };
      if (sort === 'name-desc') sortOption = { name: -1 };
      if (sort === 'rating') sortOption = { 'ratings.average': -1 };
      if (sort === 'popular') sortOption = { viewCount: -1 };

      const [products, total, categories, priceRange] = await Promise.all([
        Product.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
        Product.countDocuments(query),
        Product.distinct('category', { isActive: true }),
        Product.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
        ])
      ]);

      res.render('public/search', {
        title: q ? `Search: ${q}` : 'All Products',
        products,
        query: q || '',
        category: category || 'all',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        sort: sort || 'newest',
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        categories,
        priceRange: priceRange[0] || { min: 0, max: 1000000 },
        layout: 'layouts/main'
      });

    } catch (error) {
      console.error('Search Error:', error);
      res.status(500).render('public/500', { title: 'Search Error' });
    }
  }

  // Filter products (AJAX)
  async filterProducts(req, res) {
    try {
      const { category, tags, sizes, colors, priceRange, sort, page = 1 } = req.body;
      const limit = 24;
      const skip = (parseInt(page) - 1) * limit;

      let query = { isActive: true };

      if (category && category !== 'all') query.category = category;
      if (tags?.length) query.tags = { $in: tags };
      if (sizes?.length) query['sizes.label'] = { $in: sizes };
      if (colors?.length) query['colors.name'] = { $in: colors };
      if (priceRange) {
        query.price = { $gte: priceRange.min || 0, $lte: priceRange.max || 999999999 };
      }

      const [products, total] = await Promise.all([
        Product.find(query).sort(sort || '-createdAt').skip(skip).limit(limit).lean(),
        Product.countDocuments(query)
      ]);

      res.json({
        success: true,
        products,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ error: 'Filter error' });
    }
  }

  // ============ ADMIN METHODS ============

  // Admin: List all products with stats
  async adminList(req, res) {
    try {
      const { 
        category, status, featured, search, 
        sort = '-createdAt', page = 1, limit = 25 
      } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let query = {};
      if (category && category !== 'all') query.category = category;
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
      if (featured === 'yes') query.isFeatured = true;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const [products, total, stats] = await Promise.all([
        Product.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('createdBy', 'firstName lastName')
          .lean(),
        Product.countDocuments(query),
        this.getProductStats()
      ]);

      const categories = await Product.distinct('category');

      res.render('admin/products/list', {
        title: 'Manage Products',
        products,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        filterCategory: category || 'all',
        filterStatus: status || 'all',
        filterFeatured: featured || 'all',
        search: search || '',
        sort,
        categories,
        stats,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Admin Product List Error:', error);
      res.status(500).render('admin/500', { title: 'Server Error', layout: 'layouts/admin' });
    }
  }

  // Admin: Get product statistics
  async getProductStats() {
    const [totalProducts, activeProducts, outOfStock, totalSales, topProducts, categoryBreakdown] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ 'inventory.quantity': 0 }),
      Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.product': { $exists: true }, status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$items.price' }, count: { $sum: '$items.quantity' } } }
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.product': { $exists: true }, status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } }
      ])
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStock,
      totalSales: totalSales[0] || { total: 0, count: 0 },
      topProducts,
      categoryBreakdown
    };
  }

  // Admin: Create product form
  async createForm(req, res) {
    const categories = await Product.schema.path('category').enumValues;
    res.render('admin/products/form', {
      title: 'Add New Product',
      product: null,
      categories,
      layout: 'layouts/admin'
    });
  }

  // Admin: Create product with image processing
  async create(req, res) {
    try {
      const productData = {
        ...req.body,
        createdBy: req.session.user._id,
        isActive: req.body.isActive === 'on',
        isFeatured: req.body.isFeatured === 'on'
      };

      // Process images with Sharp
      if (req.files?.length) {
        productData.images = await Promise.all(req.files.map(async (file, index) => {
          const thumbnailPath = file.path.replace(/(\.[\w]+)$/, '-thumb$1');
          
          await sharp(file.path)
            .resize(400, 600, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath);

          return {
            url: `/uploads/${file.filename}`,
            thumbnailUrl: `/uploads/${path.basename(thumbnailPath)}`,
            alt: req.body.name,
            isMain: index === 0
          };
        }));
      }

      // Parse complex fields
      if (req.body.sizes) {
        productData.sizes = req.body.sizes.split(',').map(s => ({
          label: s.trim(),
          isAvailable: true
        }));
      }

      if (req.body.colors) {
        productData.colors = req.body.colors.split(',').map(c => {
          const [name, hex] = c.split(':');
          return { name: name.trim(), hex: hex?.trim() || '#000000' };
        });
      }

      if (req.body.tags) {
        productData.tags = req.body.tags.split(',').map(t => t.trim());
      }

      if (req.body.occasion) {
        productData.styling = {
          ...productData.styling,
          occasion: req.body.occasion.split(',').map(o => o.trim())
        };
      }

      const product = await Product.create(productData);

      // Log activity
      await this.logActivity(req, 'create', 'product', product._id, `Created product: ${product.name}`);

      req.session.success = `Product "${product.name}" created successfully`;
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Create Product Error:', error);
      req.session.error = 'Error creating product: ' + error.message;
      res.redirect('/admin/products/create');
    }
  }

  // Admin: Edit product form
  async editForm(req, res) {
    try {
      const product = await Product.findById(req.params.id).lean();
      if (!product) {
        req.session.error = 'Product not found';
        return res.redirect('/admin/products');
      }

      const categories = await Product.schema.path('category').enumValues;
      const salesData = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.product': product._id, status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]);

      const reviewStats = await Review.aggregate([
        { $match: { product: product._id, isApproved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
      ]);

      res.render('admin/products/form', {
        title: `Edit: ${product.name}`,
        product,
        categories,
        salesData: salesData[0] || { totalSold: 0, revenue: 0 },
        reviewStats: reviewStats[0] || { avgRating: 0, totalReviews: 0 },
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Edit Product Error:', error);
      res.status(500).render('admin/500', { title: 'Server Error', layout: 'layouts/admin' });
    }
  }

  // Admin: Update product
  async update(req, res) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        req.session.error = 'Product not found';
        return res.redirect('/admin/products');
      }

      const updateData = {
        ...req.body,
        isActive: req.body.isActive === 'on',
        isFeatured: req.body.isFeatured === 'on',
        updatedAt: new Date()
      };

      // Process new images
      if (req.files?.length) {
        const newImages = await Promise.all(req.files.map(async (file, index) => {
          const thumbnailPath = file.path.replace(/(\.[\w]+)$/, '-thumb$1');
          await sharp(file.path)
            .resize(400, 600, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath);
          return {
            url: `/uploads/${file.filename}`,
            thumbnailUrl: `/uploads/${path.basename(thumbnailPath)}`,
            alt: req.body.name,
            isMain: false
          };
        }));
        updateData.images = [...(product.images || []), ...newImages];
      }

      // Handle image deletion
      if (req.body.deleteImages) {
        const imagesToDelete = Array.isArray(req.body.deleteImages) 
          ? req.body.deleteImages 
          : [req.body.deleteImages];
        
        for (const imgUrl of imagesToDelete) {
          const filePath = path.join(__dirname, '..', 'public', imgUrl);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        updateData.images = product.images.filter(
          img => !imagesToDelete.includes(img.url)
        );
      }

      // Set main image
      if (req.body.mainImage && updateData.images) {
        updateData.images = updateData.images.map(img => ({
          ...img,
          isMain: img.url === req.body.mainImage
        }));
      }

      // Parse complex fields
      if (req.body.sizes) {
        updateData.sizes = req.body.sizes.split(',').map(s => ({
          label: s.trim(),
          isAvailable: true
        }));
      }

      if (req.body.tags) {
        updateData.tags = req.body.tags.split(',').map(t => t.trim());
      }

      if (req.body.occasion) {
        updateData.styling = {
          ...product.styling,
          occasion: req.body.occasion.split(',').map(o => o.trim())
        };
      }

      Object.assign(product, updateData);
      await product.save();

      await this.logActivity(req, 'update', 'product', product._id, `Updated product: ${product.name}`);

      req.session.success = `Product "${product.name}" updated successfully`;
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Update Product Error:', error);
      req.session.error = 'Error updating product: ' + error.message;
      res.redirect(`/admin/products/${req.params.id}/edit`);
    }
  }

  // Admin: Delete product
  async delete(req, res) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        req.session.error = 'Product not found';
        return res.redirect('/admin/products');
      }

      // Check if product has active orders
      const activeOrders = await Order.countDocuments({
        'items.product': product._id,
        status: { $nin: ['delivered', 'completed', 'cancelled', 'refunded'] }
      });

      if (activeOrders > 0) {
        req.session.error = `Cannot delete product with ${activeOrders} active orders. Deactivate it instead.`;
        return res.redirect('/admin/products');
      }

      // Delete associated images
      for (const image of product.images) {
        const filePath = path.join(__dirname, '..', 'public', image.url);
        const thumbPath = path.join(__dirname, '..', 'public', image.thumbnailUrl || '');
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }

      await Product.findByIdAndDelete(req.params.id);
      await this.logActivity(req, 'delete', 'product', req.params.id, `Deleted product: ${product.name}`);

      req.session.success = 'Product deleted successfully';
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Delete Product Error:', error);
      req.session.error = 'Error deleting product';
      res.redirect('/admin/products');
    }
  }

  // Admin: Bulk actions
  async bulkAction(req, res) {
    try {
      const { action, productIds } = req.body;
      const ids = Array.isArray(productIds) ? productIds : [productIds];

      switch (action) {
        case 'activate':
          await Product.updateMany({ _id: { $in: ids } }, { isActive: true });
          req.session.success = `${ids.length} products activated`;
          break;
        case 'deactivate':
          await Product.updateMany({ _id: { $in: ids } }, { isActive: false });
          req.session.success = `${ids.length} products deactivated`;
          break;
        case 'feature':
          await Product.updateMany({ _id: { $in: ids } }, { isFeatured: true });
          req.session.success = `${ids.length} products featured`;
          break;
        case 'unfeature':
          await Product.updateMany({ _id: { $in: ids } }, { isFeatured: false });
          req.session.success = `${ids.length} products unfeatured`;
          break;
        case 'delete':
          for (const id of ids) {
            const product = await Product.findById(id);
            if (product) {
              for (const image of product.images) {
                const filePath = path.join(__dirname, '..', 'public', image.url);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              }
              await Product.findByIdAndDelete(id);
            }
          }
          req.session.success = `${ids.length} products deleted`;
          break;
        default:
          req.session.error = 'Invalid action';
      }

      res.redirect('/admin/products');
    } catch (error) {
      console.error('Bulk Action Error:', error);
      req.session.error = 'Error performing bulk action';
      res.redirect('/admin/products');
    }
  }

  // Admin: Export products
  async exportProducts(req, res) {
    try {
      const products = await Product.find().lean();
      const csv = this.generateCSV(products);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products-export.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export Error:', error);
      req.session.error = 'Error exporting products';
      res.redirect('/admin/products');
    }
  }

  // Admin: Import products
  async importProducts(req, res) {
    try {
      if (!req.file) {
        req.session.error = 'Please upload a CSV file';
        return res.redirect('/admin/products');
      }

      const csvData = fs.readFileSync(req.file.path, 'utf-8');
      const products = this.parseCSV(csvData);

      let imported = 0;
      for (const productData of products) {
        if (productData.name && productData.price) {
          await Product.create({
            ...productData,
            createdBy: req.session.user._id
          });
          imported++;
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      req.session.success = `${imported} products imported successfully`;
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Import Error:', error);
      req.session.error = 'Error importing products';
      res.redirect('/admin/products');
    }
  }

  // ============ HELPER METHODS ============

  async logActivity(req, action, model, modelId, description) {
    try {
      const Activity = require('../models/Activity');
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

  generateCSV(products) {
    const headers = ['Name', 'Category', 'Price', 'Description', 'Active', 'Featured', 'Sizes', 'Tags'];
    const rows = products.map(p => [
      `"${p.name || ''}"`,
      p.category || '',
      p.price || 0,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.isActive ? 'Yes' : 'No',
      p.isFeatured ? 'Yes' : 'No',
      (p.sizes || []).map(s => s.label).join(';'),
      (p.tags || []).join(';')
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  parseCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((header, i) => {
        if (header === 'name') obj.name = values[i];
        if (header === 'category') obj.category = values[i];
        if (header === 'price') obj.price = parseFloat(values[i]) || 0;
        if (header === 'description') obj.description = values[i];
        if (header === 'active') obj.isActive = values[i]?.toLowerCase() === 'yes';
        if (header === 'featured') obj.isFeatured = values[i]?.toLowerCase() === 'yes';
        if (header === 'sizes') obj.sizes = (values[i] || '').split(';').map(s => ({ label: s.trim(), isAvailable: true }));
        if (header === 'tags') obj.tags = (values[i] || '').split(';').map(t => t.trim());
      });
      return obj;
    });
  }
}

module.exports = new ProductController();