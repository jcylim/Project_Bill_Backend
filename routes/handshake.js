const express = require('express');
const {
    handshakeById, 
    getHandshake, 
    createHandshake,
    handshakesByCustomer, 
    assignHandshake,
    unassignHandshake,
    hasAuthorization,
    updateHandshake, 
    deleteHandshake,
    setHandshakeStage,
    comment,
    uncomment
} = require('../controllers/handshake');
const { requireSignIn } = require('../controllers/auth');
const { companyById } = require('../controllers/company');
const { userById } = require('../controllers/user');
const { customerById } = require('../controllers/customer');
const { createHandshakeValidator } = require('../validator');

const router = express.Router();

// comment/uncomment
router.put('/:companyId/handshake/comment', requireSignIn, comment);
router.put('/:companyId/handshake/uncomment', requireSignIn, hasAuthorization, uncomment);

// get handshake based on id
// get handshakes by customer
// create new handshake
// update handshake
// delete handshake
// assign handshake to users
// unassign handshake to certain user
// set handshake stage
router.get('/:companyId/handshake/:handshakeId', requireSignIn, getHandshake);
router.get('/:companyId/handshakes/customer/:customerId', requireSignIn, handshakesByCustomer);
router.post('/:companyId/handshake', requireSignIn, hasAuthorization, createHandshake, createHandshakeValidator);
router.put('/:companyId/handshake/:handshakeId', requireSignIn, updateHandshake);
router.delete('/:companyId/handshake/:handshakeId', requireSignIn, deleteHandshake);
router.put('/:companyId/handshake/assign/:handshakeId', requireSignIn, assignHandshake);
router.put('/:companyId/handshake/unassign/:handshakeId', requireSignIn, unassignHandshake);
router.put('/:companyId/handshake/stage/:handshakeId', requireSignIn, setHandshakeStage);

// any route containing handshakeId, our will first execute handshakeById()
router.param('handshakeId', handshakeById);
// any route containing taskId, our will first execute userById()
router.param('userId', userById);
// any route containing customerId, our will first execute customerById()
router.param('customerId', customerById);
// any route containing taskId, our will first execute companyById()
router.param('companyId', companyById);

module.exports = router;