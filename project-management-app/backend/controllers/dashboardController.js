const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Dashboard summary: project progress, task stats, upcoming deadlines,
//          completed vs pending, and team performance overview.
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const isElevated = req.user.role === 'Admin' || req.user.role === 'ProjectManager';

  // Scope: Admin/PM see org/project-wide data; Team Members see their own.
  const projectFilter = isElevated
    ? {}
    : { $or: [{ owner: req.user._id }, { projectManager: req.user._id }, { members: req.user._id }] };

  const taskFilter = isElevated ? {} : { assignedTo: req.user._id };

  const [projects, taskStatusAgg, upcomingDeadlines, teamPerformance, totalTasks] = await Promise.all([
    Project.find(projectFilter).select('name status deadline'),

    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Task.find({ ...taskFilter, dueDate: { $gte: new Date() } })
      .sort('dueDate')
      .limit(10)
      .populate('project', 'name')
      .populate('assignedTo', 'name'),

    Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          totalTasks: 1,
          completedTasks: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalTasks', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { completionRate: -1 } },
    ]),

    Task.countDocuments(taskFilter),
  ]);

  const statusCounts = { ToDo: 0, InProgress: 0, Completed: 0 };
  taskStatusAgg.forEach((s) => {
    statusCounts[s._id] = s.count;
  });

  const projectProgress = await Promise.all(
    projects.map(async (p) => {
      const [total, completed] = await Promise.all([
        Task.countDocuments({ project: p._id }),
        Task.countDocuments({ project: p._id, status: 'Completed' }),
      ]);
      return {
        projectId: p._id,
        name: p.name,
        status: p.status,
        deadline: p.deadline,
        totalTasks: total,
        completedTasks: completed,
        percentComplete: total === 0 ? 0 : Math.round((completed / total) * 100),
      };
    })
  );

  res.json({
    success: true,
    data: {
      taskStatistics: {
        total: totalTasks,
        toDo: statusCounts.ToDo,
        inProgress: statusCounts.InProgress,
        completed: statusCounts.Completed,
        pending: statusCounts.ToDo + statusCounts.InProgress,
      },
      projectProgress,
      upcomingDeadlines,
      teamPerformance,
    },
  });
});

module.exports = { getDashboard };
