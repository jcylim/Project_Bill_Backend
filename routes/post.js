const express = require('express');
const { 
    getPosts, 
    createPost, 
    postsByUser, 
    postById, 
    updatePost, 
    deletePost,
    isPoster,
    photo,
    singlePost,
    like,
    unlike,
    comment,
    uncomment,
    setPostStatus,
    makePayment
} = require('../controllers/post');
const { requireSignIn } = require('../controllers/auth');
const { userById } = require('../controllers/user');
const { createPostValidator } = require('../validator');

const router = express.Router();

router.get('/posts', getPosts);

// like/unlike
router.put('/post/like', requireSignIn, like);
router.put('/post/unlike', requireSignIn, unlike);

// comment/uncomment
router.put('/post/comment', requireSignIn, comment);
router.put('/post/uncomment', requireSignIn, uncomment);

router.post('/post/new/:userId', requireSignIn, 
    createPost, createPostValidator);
router.get('/posts/:userId', requireSignIn, postsByUser);
router.get('/post/:postId', singlePost);
router.put('/post/:postId', requireSignIn, isPoster, updatePost);
router.delete('/post/:postId', requireSignIn, isPoster, deletePost);
router.put('/post/status/:postId', requireSignIn, setPostStatus);

// photo
router.get('/post/photo/:postId', photo);

// Stripe Payment Mechanism
router.post('/post/payment/:postId', requireSignIn, makePayment);

// any route containing userId, our will first execute userById()
router.param('userId', userById);
// any route containing postId, our will first execute postById()
router.param('postId', postById);

module.exports = router;