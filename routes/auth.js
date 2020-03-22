const express = require('express');
const { signUp, signIn, signOut } = require('../controllers/auth');
const { userById } = require('../controllers/user');
const { userSignUpValidator } = require('../validator');

const router = express.Router();
router.post('/signup', userSignUpValidator, signUp);
router.post('/signin', signIn);
router.get('/signout', signOut);

// any route containing userId, our will first execute userById()
router.param('userID', userById);

module.exports = router;