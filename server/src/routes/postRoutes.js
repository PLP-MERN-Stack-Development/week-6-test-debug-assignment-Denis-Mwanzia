const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/postController');

const router = express.Router();

router.route('/').get(getPosts).post(protect, createPost);
router
  .route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

module.exports = router;
