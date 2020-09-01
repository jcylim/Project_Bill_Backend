const express = require('express');
const {
    companyById,
    getCompany,
    getBasicCompanyInfo,
    addNewUser,
    addUser,
    addTask,
    allUsers,
    allTasks,
    allCustomers,
    allHandshakes,
    updateCompany,
    companyPhoto,
    hasAuthorization,
    comment,
    uncomment
} = require('../controllers/company');
const { requireSignIn } = require('../controllers/auth');
const { passwordResetValidator } = require('../validator');

const router = express.Router();

// comment/uncomment
router.put('/:companyId/comment', requireSignIn, comment);
router.put('/:companyId/uncomment', requireSignIn, hasAuthorization, uncomment);

// add new users to company
// add existing users to company
// add new tasks to company
// update company's info (name, about, email, password, photo, stages)
// get all users from company
// get all tasks from company
// get all customers from company
// get all handshakes from company
router.post('/:companyId/user/new', requireSignIn, hasAuthorization, addNewUser);
router.put('/:companyId/user', requireSignIn, hasAuthorization, addUser);
router.post('/:companyId/task', requireSignIn, hasAuthorization, addTask);
router.get('/:companyId', requireSignIn, getCompany);
router.get('/:companyId/basic', getBasicCompanyInfo);
router.put('/:companyId', requireSignIn, hasAuthorization, updateCompany);
router.get('/:companyId/users', requireSignIn, allUsers);
router.get('/:companyId/tasks', requireSignIn, allTasks);
router.get('/:companyId/customers', requireSignIn, allCustomers);
router.get('/:companyId/handshakes', requireSignIn, allHandshakes);

// photo 
router.get('/:companyId/photo', companyPhoto);

// any route containing companyById, our will first execute companyById()
router.param('companyId', companyById);

module.exports = router;