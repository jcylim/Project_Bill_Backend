const express = require('express');
const { 
    signUp, 
    signIn, 
    signOut,
    forgotPassword,
    resetPassword 
} = require('../controllers/auth');
const { userById } = require('../controllers/user');
const { userSignUpValidator, passwordResetValidator } = require('../validator');

const router = express.Router();

// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

router.post('/signup', userSignUpValidator, signUp);
router.post('/signin', signIn);
router.get('/signout', signOut);

// any route containing userId, our will first execute userById()
router.param('userID', userById);

module.exports = router;