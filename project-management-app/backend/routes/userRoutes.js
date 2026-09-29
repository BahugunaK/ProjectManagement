const express = require('express');
const { getUsers, updateUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.get('/', authorize('Admin', 'ProjectManager'), getUsers);
router.patch('/:id', authorize('Admin'), updateUser);

module.exports = router;
