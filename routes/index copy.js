const express = require('express');
const router = express.Router();

// Mount all route groups
router.use('/', require('./public'));
// router.use('/auth', require('./auth'));
// router.use('/products', require('./products'));
// router.use('/fabrics', require('./fabrics'));
// router.use('/orders', require('./orders'));
// router.use('/tailoring', require('./tailoring'));
// router.use('/appointments', require('./appointments'));
// router.use('/measurements', require('./measurements'));
// router.use('/reviews', require('./reviews'));
// router.use('/admin', require('./admin'));
// router.use('/api', require('./api'));
// router.use('/cart', require('./cart'));
// router.use('/wishlist', require('./wishlist'));
// router.use('/profile', require('./profile'));

module.exports = router;