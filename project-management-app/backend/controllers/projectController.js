const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Helper: is user allowed to manage (edit/delete) this project?
const canManageProject = (user, project) =>
  user.role === 'Admin' ||
  (project.projectManager && project.projectManager.toString() === user._id.toString()) ||
  project.owner.toString() === user._id.toString();

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin, ProjectManager)
const createProject = asyncHandler(async (req, res) => {
  const { name, description, deadline, projectManager, members } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Project name is required');
  }

  const project = await Project.create({
    name,
    description,
    deadline,
    owner: req.user._id,
    projectManager: projectManager || (req.user.role === 'ProjectManager' ? req.user._id : undefined),
    members: members || [],
  });

  if (req.logAction) await req.logAction('CREATE_PROJECT', 'Project', project._id);

  res.status(201).json({ success: true, data: project });
});

// @desc    List projects visible to the current user, with search/filter/pagination
// @route   GET /api/projects?search=&status=&page=&limit=
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  // Admins see everything; others only see projects they own, manage, or are a member of.
  if (req.user.role !== 'Admin') {
    filter.$or = [
      { owner: req.user._id },
      { projectManager: req.user._id },
      { members: req.user._id },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email')
      .populate('projectManager', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get a single project by id
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('projectManager', 'name email')
    .populate('members', 'name email');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  res.json({ success: true, data: project });
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Admin, assigned Project Manager, owner)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!canManageProject(req.user, project)) {
    res.status(403);
    throw new Error('Not authorized to modify this project');
  }

  const { name, description, status, deadline, projectManager, members } = req.body;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;
  if (deadline !== undefined) project.deadline = deadline;
  if (projectManager !== undefined) project.projectManager = projectManager;
  if (members !== undefined) project.members = members;

  await project.save();
  if (req.logAction) await req.logAction('UPDATE_PROJECT', 'Project', project._id);

  res.json({ success: true, data: project });
});

// @desc    Delete a project (and its tasks)
// @route   DELETE /api/projects/:id
// @access  Private (Admin, owner)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (req.user.role !== 'Admin' && project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this project');
  }

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  if (req.logAction) await req.logAction('DELETE_PROJECT', 'Project', project._id);

  res.json({ success: true, message: 'Project and its tasks deleted' });
});

// @desc    Add a member to a project
// @route   POST /api/projects/:id/members
// @access  Private (Admin, Project Manager of that project)
const addMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  if (!canManageProject(req.user, project)) {
    res.status(403);
    throw new Error('Not authorized to modify this project');
  }

  const { userId } = req.body;
  if (!project.members.map(String).includes(userId)) {
    project.members.push(userId);
    await project.save();
  }

  if (req.logAction) await req.logAction('ADD_PROJECT_MEMBER', 'Project', project._id, { userId });

  res.json({ success: true, data: project });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  canManageProject,
};
