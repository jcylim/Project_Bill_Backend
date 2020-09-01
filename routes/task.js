const express = require('express');
const {
    taskById, 
    getTask, 
    createTask, 
    tasksByUser,
    tasksByCustomer,
    tasksByHandshake, 
    assignTask,
    unassignTask,
    hasAuthorization,
    updateTask, 
    deleteTask,
    isPoster,
    setTaskStage,
    comment,
    uncomment
} = require('../controllers/task');
const { requireSignIn } = require('../controllers/auth');
const { companyById } = require('../controllers/company');
const { userById } = require('../controllers/user');
const { customerById } = require('../controllers/customer');
const { handshakeById } = require('../controllers/handshake');
const { createTaskValidator } = require('../validator');

const router = express.Router();

// like/unlike
// router.put('/:companyId/task/like', requireSignIn, like);
// router.put('/:companyId/task/unlike', requireSignIn, unlike);

// comment/uncomment
router.put('/:companyId/task/comment', requireSignIn, comment);
router.put('/:companyId/task/uncomment', requireSignIn, hasAuthorization, uncomment);

// get task based on id
// get tasks by user
// get tasks by customer
// get tasks by handshake
// create new task
// update task
// delete task
// assign task to users
// unassign task to certain user
// set task stage
router.get('/:companyId/task/:taskId', requireSignIn, getTask);
router.get('/:companyId/tasks/:userId', requireSignIn, tasksByUser);
router.get('/:companyId/tasks/customer/:customerId', requireSignIn, tasksByCustomer);
router.get('/:companyId/tasks/handshake/:handshakeId', requireSignIn, tasksByHandshake);
router.post('/:companyId/task/new/:userId', requireSignIn, hasAuthorization, createTask, createTaskValidator);
router.put('/:companyId/task/:taskId', requireSignIn, isPoster, updateTask);
router.delete('/:companyId/task/:taskId', requireSignIn, isPoster, deleteTask);
router.put('/:companyId/task/assign/:taskId', requireSignIn, assignTask);
router.put('/:companyId/task/unassign/:taskId', requireSignIn, unassignTask);
router.put('/:companyId/task/stage/:taskId', requireSignIn, setTaskStage);

// any route containing userId, our will first execute taskById()
router.param('taskId', taskById);
// any route containing handshakeId, our will first execute handshakeById()
router.param('handshakeId', handshakeById);
// any route containing taskId, our will first execute userById()
router.param('userId', userById);
// any route containing customerId, our will first execute customerById()
router.param('customerId', customerById);
// any route containing taskId, our will first execute companyById()
router.param('companyId', companyById);

module.exports = router;