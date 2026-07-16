const Order = require('../models/Order');
const Product = require('../models/Product');
const Fabric = require('../models/Fabric');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// Customer: View own orders
exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name images price')
      .populate('items.fabric', 'name images price');

    res.render('public/orders', {
      title: 'My Orders',
      orders,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('public/500', { title: 'Server Error' });
  }
};

// Customer: View single order
exports.orderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.user._id
    }).populate('items.product items.fabric');

    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/orders');
    }

    const invoice = await Invoice.findOne({ order: order._id });

    res.render('public/order-detail', {
      title: `Order #${order.orderNumber}`,
      order,
      invoice,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('public/500', { title: 'Server Error' });
  }
};

// Customer: Create order
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, deliveryMethod, notes } = req.body;
    
    let orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          size: item.size,
          color: item.color
        });
        subtotal += product.price * item.quantity;
      }
      if (item.fabricId) {
        const fabric = await Fabric.findById(item.fabricId);
        if (!fabric) continue;
        orderItems.push({
          fabric: fabric._id,
          name: fabric.name,
          quantity: item.quantity,
          price: fabric.price,
          unit: fabric.unit
        });
        subtotal += fabric.price * item.quantity;
      }
    }

    const tax = subtotal * 0.075;
    const shipping = subtotal >= 200000 ? 0 : 5000;

    const order = await Order.create({
      user: req.session.user._id,
      type: items.some(i => i.productId) && items.some(i => i.fabricId) ? 'mixed' : 
            items.some(i => i.productId) ? 'product' : 'fabric',
      items: orderItems,
      pricing: {
        subtotal,
        tax,
        shipping,
        total: subtotal + tax + shipping
      },
      shippingAddress,
      deliveryMethod: deliveryMethod || 'store_pickup',
      notes,
      status: 'pending'
    });

    // Create invoice
    const invoice = await Invoice.create({
      order: order._id,
      user: req.session.user._id,
      type: order.type,
      items: orderItems.map(i => ({
        description: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        total: i.price * i.quantity
      })),
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
      status: 'sent',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    req.session.success = 'Order placed successfully!';
    res.redirect(`/orders/${order._id}`);
  } catch (error) {
    console.error(error);
    req.session.error = 'Error creating order';
    res.redirect('/cart');
  }
};

// Admin: List all orders
exports.adminList = async (req, res) => {
  try {
    const { status, type, page: pageNum } = req.query;
    const page = parseInt(pageNum) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName phone email');

    const total = await Order.countDocuments(query);

    res.render('admin/orders', {
      title: 'Manage Orders',
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      filterStatus: status || 'all',
      filterType: type || 'all',
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('admin/500', { title: 'Server Error' });
  }
};

// Admin: Order detail
exports.adminDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName phone email')
      .populate('items.product')
      .populate('items.fabric');

    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }

    const invoice = await Invoice.findOne({ order: order._id });

    res.render('admin/order-detail', {
      title: `Order #${order.orderNumber}`,
      order,
      invoice,
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('admin/500', { title: 'Server Error' });
  }
};

// Admin: Update order status
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.session.user._id
    });

    if (status === 'delivered' || status === 'completed') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      order.payment.amountPaid = order.pricing.total;
    }

    await order.save();

    req.session.success = `Order #${order.orderNumber} status updated to ${status}`;
    res.redirect(`/admin/orders/${order._id}`);
  } catch (error) {
    console.error(error);
    req.session.error = 'Error updating order status';
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};

// Admin: Assign tailor
exports.assignTailor = async (req, res) => {
  try {
    const { tailorId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }

    order.tailoringDetails.assignedTailor = tailorId;
    await order.save();

    req.session.success = 'Tailor assigned successfully';
    res.redirect(`/admin/orders/${order._id}`);
  } catch (error) {
    console.error(error);
    req.session.error = 'Error assigning tailor';
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};