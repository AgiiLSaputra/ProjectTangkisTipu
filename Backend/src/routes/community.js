import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  listPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  createComment,
  deleteComment,
  toggleLike,
  toggleBookmark,
  getBookmarks,
  listPostsQuerySchema,
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  createCommentSchema,
  commentIdParamSchema,
} from '../controllers/communityController.js';

const router = Router();

// Public routes (dengan optional auth untuk mendapatkan user context)
router.get('/posts', optionalAuth, validate(listPostsQuerySchema, 'query'), listPosts);
router.get('/posts/:postId', optionalAuth, validate(postIdParamSchema, 'params'), getPost);

// Protected routes (butuh auth - participant atau admin)
router.post('/posts', requireAuth, validate(createPostSchema, 'body'), createPost);
router.patch('/posts/:postId', requireAuth, validate(postIdParamSchema, 'params'), validate(updatePostSchema, 'body'), updatePost);
router.delete('/posts/:postId', requireAuth, validate(postIdParamSchema, 'params'), deletePost);

// Comments
router.post('/posts/:postId/comments', requireAuth, validate(postIdParamSchema, 'params'), validate(createCommentSchema, 'body'), createComment);
router.delete('/posts/:postId/comments/:commentId', requireAuth, validate(postIdParamSchema, 'params'), validate(commentIdParamSchema, 'params'), deleteComment);

// Likes & Bookmarks
router.post('/posts/:postId/like', requireAuth, validate(postIdParamSchema, 'params'), toggleLike);
router.post('/posts/:postId/bookmark', requireAuth, validate(postIdParamSchema, 'params'), toggleBookmark);
router.get('/bookmarks', requireAuth, getBookmarks);

export default router;
