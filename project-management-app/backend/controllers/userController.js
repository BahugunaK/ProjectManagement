const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    List all users (with search & pagination) - for assigning to projects/tasks
// @route   GET /api/users?search=&role=&page=&limit=
// @access  Private (Admin, ProjectManager)
const getUsers = asyncHandler(async (req, res) => {
  const { search = '', role, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  if (role) filter.role = role;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Update a user's role or active status (admin only)
// @route   PATCH /api/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;

  await user.save();
  if (req.logAction) await req.logAction('UPDATE_USER', 'User', user._id, { role, isActive });

  res.json({ success: true, data: user.toSafeObject() });
});

module.exports = { getUsers, updateUser };
