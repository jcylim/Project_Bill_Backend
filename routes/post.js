const express = require('express');
const { 
    getPost, 
    createPost, 
    postsByUser, 
    postById, 
    updatePost, 
    deletePost,
    isPoster 
} = require('../controllers/post');
const { requireSignIn } = require('../controllers/auth');
const { userById } = require('../controllers/user');
const { createPostValidator } = require('../validator');

const router = express.Router();

router.get('/posts', getPost);
router.post('/post/new/:userId', requireSignIn, 
    createPost, createPostValidator);
router.get('/posts/:userId', requireSignIn, postsByUser);
router.put('/post/:postId', requireSignIn, isPoster, updatePost);
router.delete('/post/:postId', requireSignIn, isPoster, deletePost);

// any route containing userId, our will first execute userById()
router.param('userId', userById);
// any route containing postId, our will first execute postById()
router.param('postId', postById);

module.exports = router;