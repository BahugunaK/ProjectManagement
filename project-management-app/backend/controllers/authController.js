const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }

  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  // Only allow self-registration as TeamMember or ProjectManager;
  // Admin accounts should be provisioned by an existing Admin (see userController).
  const safeRole = ['ProjectManager', 'TeamMember'].includes(role) ? role : 'TeamMember';

  const user = await User.create({ name, email, password, role: safeRole });

  if (req.logAction) await req.logAction('REGISTER', 'User', user._id);

  res.status(201).json({
    success: true,
    data: {
      user: user.toSafeObject(),
      token: generateToken(user._id),
    },
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated');
  }

  if (req.logAction) await req.logAction('LOGIN', 'User', user._id);

  res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
      token: generateToken(user._id),
    },
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toSafeObject() });
});

module.exports = { registerUser, loginUser, getMe };
