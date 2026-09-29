const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  addAttachment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.post('/:id/comments', addComment);
router.post('/:id/attachments', upload.single('file'), addAttachment);

module.exports = router;
