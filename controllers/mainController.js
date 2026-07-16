// Example controller for main pages
exports.home = (req, res) => {
    res.render('public/landing', {
        title: 'EL ATTIRE - Premium Tailoring',
        currentPage: 'home',
        featuredProducts: [] // Add your featured products from DB
    });
};

exports.about = (req, res) => {
    res.render('public/about', {
        title: 'About Us - EL ATTIRE',
        currentPage: 'about'
    });
};

exports.contact = (req, res) => {
    res.render('public/contact', {
        title: 'Contact Us - EL ATTIRE',
        currentPage: 'contact'
    });
};