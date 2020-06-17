const express = require('express');
const { 
    userById, 
    allUsers, 
    getUser, 
    updateUser, 
    deleteUser,
    userPhoto,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower, 
    findPeople,
    hasAuthorization 
} = require('../controllers/user');
const { requireSignIn } = require('../controllers/auth');

const router = express.Router();

router.put('/user/follow', requireSignIn, addFollowing, addFollower);
router.put('/user/unfollow', requireSignIn, removeFollowing, removeFollower);

router.get('/users', allUsers);
router.get('/user/:userId', requireSignIn, getUser);
router.put('/user/:userId', requireSignIn, hasAuthorization, updateUser);
router.delete('/user/:userId', requireSignIn, hasAuthorization, deleteUser);

// photo 
router.get('/user/photo/:userId', userPhoto);

// who to follow
router.get('/user/findpeople/:userId', requireSignIn, findPeople);

// any route containing :userId, our app will first execute userById()
router.param('userId', userById);

module.exports = router;