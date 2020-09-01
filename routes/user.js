const express = require('express');
const { companyById } = require('../controllers/company');
const { 
    userById,
    getUser,
    updateUser,
    removeUser, 
    userPhoto,
    hasAuthorization,
    isAdmin, 
} = require('../controllers/user');
const { unassignTask } = require('../controllers/task');
const { requireSignIn } = require('../controllers/auth');

const router = express.Router();

// get user based on id
// update user
// remove user from company
router.get("/:companyId/user/:userId", requireSignIn, getUser);
router.put('/:companyId/user/:userId', requireSignIn, hasAuthorization, updateUser);
router.delete("/:companyId/user/:userId", requireSignIn, isAdmin, removeUser, unassignTask);
//router.delete('/:companyId/user/:userId', requireSignIn, isAdmin, removeUser, deleteUser);

// photo 
router.get('/:companyId/user/photo/:userId', userPhoto);

// any route containing :userId, our app will first execute userById()
router.param('userId', userById);
// any route containing companyById, our will first execute companyById()
router.param('companyId', companyById);

module.exports = router;