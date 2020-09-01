const express = require('express');
const { 
    signUp, 
    signIn, 
    userSignIn,
    signOut,
    forgotPassword,
    resetPassword,
    userForgotPassword,
    userResetPassword
} = require('../controllers/auth');
const { companySignUpValidator, passwordResetValidator } = require('../validator');

const router = express.Router();

// password forgot and reset routes
router.put("/root/forgot-password", forgotPassword);
router.put("/root/reset-password", passwordResetValidator, resetPassword);

// password forgot and reset routes for users
router.put("/forgot-password", userForgotPassword);
router.put("/reset-password", passwordResetValidator, userResetPassword);

// root signup, signin
router.post('/root/signup', companySignUpValidator, signUp);
router.post('/root/signin', signIn);

// company specific signin
router.post('/signin', userSignIn);

router.get('/signout', signOut);

module.exports = router;