const express = require('express');
const { 
    userById, 
    allUsers,
    allChefs,
    allFoodSuppliers, 
    getUser, 
    updateUser, 
    deleteUser,
    userPhoto,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower, 
    findPeople,
    hasAuthorization,
    paymentOnboarding,
    paymentAccountReauth 
} = require('../controllers/user');
const { requireSignIn } = require('../controllers/auth');

const router = express.Router();

router.put('/user/follow', requireSignIn, addFollowing, addFollower);
router.put('/user/unfollow', requireSignIn, removeFollowing, removeFollower);

router.get('/users', allUsers);
router.get('/chefs', allChefs);
router.get('/foodSuppliers', allFoodSuppliers);
router.get('/user/:userId', requireSignIn, getUser);
router.put('/user/:userId', requireSignIn, hasAuthorization, updateUser);
router.delete('/user/:userId', requireSignIn, hasAuthorization, deleteUser);

// photo 
router.get('/user/photo/:userId', userPhoto);

// who to follow
router.get('/user/findpeople/:userId', requireSignIn, findPeople);

// Stripe payment onboarding
router.get('/payment/onboarding/:userId', requireSignIn, paymentOnboarding);
router.get('/payment/reauth', requireSignIn, paymentAccountReauth);

// any route containing :userId, our app will first execute userById()
router.param('userId', userById);

module.exports = router;