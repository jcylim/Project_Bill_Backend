const express = require('express');
const {
    customerById, 
    getCustomer, 
    addCustomer, 
    addCustomers,
    updateCustomer, 
    removeTasksForCustomer,
    removeHandshakesForCustomer,
    removeCustomer,
    isAdmin,
    hasAuthorization,
    comment,
    uncomment,
    convertToCustomer
} = require('../controllers/customer');
const { requireSignIn } = require('../controllers/auth');
const { companyById } = require('../controllers/company');
const { userById } = require('../controllers/user');
const { createCustomerValidator, createCustomersValidator } = require('../validator');

const router = express.Router();

// comment/uncomment
router.put('/:companyId/customer/comment', requireSignIn, comment);
router.put('/:companyId/customer/uncomment', requireSignIn, hasAuthorization, uncomment);

// get customer
// add customer to company
// update customer
// remove customer from company
// convert from prospect to customer
router.get('/:companyId/customer/:customerId', requireSignIn, hasAuthorization, getCustomer);
router.post('/:companyId/customer', requireSignIn, hasAuthorization, createCustomerValidator, addCustomer);
router.post('/:companyId/customers', requireSignIn, hasAuthorization, createCustomersValidator, addCustomers);
router.put('/:companyId/customer/:customerId', requireSignIn, hasAuthorization, updateCustomer);
router.delete('/:companyId/customer/:customerId', requireSignIn, isAdmin, removeTasksForCustomer, removeHandshakesForCustomer, removeCustomer);
router.put('/:companyId/customer/convert/:customerId', requireSignIn, hasAuthorization, convertToCustomer);

// any route containing customerId, our will first execute userById()
router.param('userId', userById);
// any route containing customerId, our will first execute customerById()
router.param('customerId', customerById);
// any route containing taskId, our will first execute companyById()
router.param('companyId', companyById);

module.exports = router;