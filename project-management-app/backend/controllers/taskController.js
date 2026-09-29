const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { canManageProject } = require('./projectController');

// @desc    Create a task under a project
// @route   POST /api/tasks
// @access  Private (Admin, Project Manager)
const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignedTo, priority, status, dueDate } = req.body;

  if (!title || !project) {
    res.status(400);
    throw new Error('Task title and project are required');
  }

  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!canManageProject(req.user, projectDoc) && req.user.role === 'TeamMember') {
    res.status(403);
    throw new Error('Team members cannot create tasks');
  }

  const task = await Task.create({
    title,
    description,
    project,
    assignedTo,
    createdBy: req.user._id,
    priority,
    status,
    dueDate,
  });

  if (req.logAction) await req.logAction('CREATE_TASK', 'Task', task._id);

  res.status(201).json({ success: true, data: task });
});

// @desc    List tasks with search, filter (status/priority/project/assignedTo) & pagination
// @route   GET /api/tasks?project=&status=&priority=&assignedTo=&search=&page=&limit=
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const {
    project,
    status,
    priority,
    assignedTo,
    search = '',
    page = 1,
    limit = 10,
    sortBy = '-createdAt',
  } = req.query;

  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.$text = { $search: search };

  // Team members only see tasks assigned to them or created by them, unless a project scope
  // they belong to is specified (enforced at the route/project level in a fuller implementation).
  if (req.user.role === 'TeamMember' && !project) {
    filter.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('project', 'name')
    .populate('comments.author', 'name email');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({ success: true, data: task });
});

// @desc    Update a task (edit fields, reassign, change status/priority)
// @route   PUT /api/tasks/:id
// @access  Private (Admin, PM, or assignee for status updates)
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  const isElevated = req.user.role === 'Admin' || req.user.role === 'ProjectManager';

  if (!isElevated && !isAssignee) {
    res.status(403);
    throw new Error('Not authorized to modify this task');
  }

  const { title, description, assignedTo, priority, status, dueDate } = req.body;

  // Team members (assignees) may only update status; PM/Admin can edit everything.
  if (isElevated) {
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
  }
  if (status !== undefined) task.status = status;

  await task.save();
  if (req.logAction) await req.logAction('UPDATE_TASK', 'Task', task._id);

  res.json({ success: true, data: task });
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, Project Manager)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (req.user.role === 'TeamMember') {
    res.status(403);
    throw new Error('Team members cannot delete tasks');
  }

  await task.deleteOne();
  if (req.logAction) await req.logAction('DELETE_TASK', 'Task', task._id);

  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error('Comment text is required');
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.comments.push({ author: req.user._id, text });
  await task.save();

  if (req.logAction) await req.logAction('COMMENT_TASK', 'Task', task._id);

  res.status(201).json({ success: true, data: task.comments[task.comments.length - 1] });
});

// @desc    Upload a file attachment to a task
// @route   POST /api/tasks/:id/attachments
// @access  Private
const addAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const attachment = {
    fileName: req.file.originalname,
    filePath: req.file.path,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
  };

  task.attachments.push(attachment);
  await task.save();

  if (req.logAction) await req.logAction('ATTACH_FILE', 'Task', task._id, { fileName: attachment.fileName });

  res.status(201).json({ success: true, data: task.attachments[task.attachments.length - 1] });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  addAttachment,
};
