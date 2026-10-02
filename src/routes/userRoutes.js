const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);
router.get('/', authorize('ADMIN', 'MANAGER'), getUsers);
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);

module.exports = router;
