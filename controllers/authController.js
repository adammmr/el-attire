const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.getLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('public/login', {
    title: 'Sign In',
    layout: 'layouts/main'
  });
};

exports.postLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      req.session.error = 'Please provide phone number and password';
      return res.redirect('/auth/login');
    }

    const user = await User.findOne({ phone }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      req.session.error = 'Invalid phone number or password';
      return res.redirect('/auth/login');
    }

    if (!user.isActive) {
      req.session.error = 'Your account has been deactivated. Contact support.';
      return res.redirect('/auth/login');
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    req.session.user = {
      _id: user._id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImage: user.profileImage
    };

    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    
    res.redirect(redirectTo);
  } catch (error) {
    console.error(error);
    req.session.error = 'An error occurred during login';
    res.redirect('/auth/login');
  }
};

exports.getRegister = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('public/register', {
    title: 'Create Account',
    layout: 'layouts/main'
  });
};

exports.postRegister = async (req, res) => {
  try {
    const { phone, email, password, firstName, lastName, gender, dateOfBirth } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      req.session.error = 'A user with this phone number already exists';
      return res.redirect('/auth/register');
    }

    const user = await User.create({
      phone,
      email,
      password,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      role: 'customer'
    });

    req.session.user = {
      _id: user._id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    req.session.success = 'Account created successfully! Complete your measurements.';
    res.redirect('/measurements');
  } catch (error) {
    console.error(error);
    req.session.error = 'Error creating account. Please try again.';
    res.redirect('/auth/register');
  }
};

exports.getForgotPassword = (req, res) => {
  res.render('public/forgot-password', {
    title: 'Forgot Password',
    layout: 'layouts/main'
  });
};

exports.postForgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      req.session.error = 'No account found with that phone number';
      return res.redirect('/auth/forgot-password');
    }

    // Generate reset token (in production, send via SMS)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 300000; // 5 minutes
    await user.save({ validateBeforeSave: false });

    // In production: Send SMS with reset token
    console.log(`Password reset token for ${phone}: ${resetToken}`);

    req.session.success = 'Verification code sent to your phone';
    res.redirect(`/auth/reset-password?phone=${phone}`);
  } catch (error) {
    console.error(error);
    req.session.error = 'Error processing request';
    res.redirect('/auth/forgot-password');
  }
};

exports.getResetPassword = (req, res) => {
  res.render('public/reset-password', {
    title: 'Reset Password',
    phone: req.query.phone,
    layout: 'layouts/main'
  });
};

exports.postResetPassword = async (req, res) => {
  try {
    const { phone, token, password } = req.body;
    
    const user = await User.findOne({
      phone,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      req.session.error = 'Invalid or expired verification code';
      return res.redirect(`/auth/reset-password?phone=${phone}`);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    req.session.success = 'Password reset successful! Please sign in.';
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    req.session.error = 'Error resetting password';
    res.redirect(`/auth/reset-password?phone=${req.body.phone}`);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
};