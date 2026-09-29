const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(authorize('Admin', 'ProjectManager'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('Admin', 'ProjectManager'), updateProject)
  .delete(authorize('Admin', 'ProjectManager'), deleteProject);

router.post('/:id/members', authorize('Admin', 'ProjectManager'), addMember);

module.exports = router;
