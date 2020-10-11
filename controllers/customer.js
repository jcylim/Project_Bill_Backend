const _ = require('lodash');
const addressValidator = require('address-validator');
const Address = addressValidator.Address;
const phone = require('phone');
const { isValid } = require('tin-validator');
const Task = require('../models/task');
const Company = require('../models/company');
const Customer = require('../models/customer');
const Handshake = require('../models/handshake');
const formidable = require('formidable');
const fs = require('fs');

exports.customerById = (req, res, next, id) => {
    Customer.findById(id)
    .populate('postedBy', '_id first_name last_name email role')
    .populate('comments.postedBy', '_id first_name last_name email role company')
    .exec((err, customer) => {
        if (err || !customer) {
            return res.status(400).json({
                error: 'Customer not found'
            });
        }

        req.customer = customer; // adds customer object in req with customer info
        next();
    });
};

exports.hasAuthorization = (req, res, next) => {
    let isAdmin = req.auth && (req.auth.company === String(req.company._id) && req.auth.role === "admin");
    let isUserInCompany = req.auth && req.auth.company === String(req.company._id);

    const authorized = isUserInCompany || isAdmin;

    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

exports.isAdmin = (req, res, next) => {
    const authorized = req.auth && (req.auth.company === String(req.company._id) && req.auth.role === "admin");

    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action. Ask admin.'
        });
    }
    next();
};

exports.getCustomer = (req, res) => {
    return res.json(req.customer);
};

exports.addCustomer = async (req, res) => {
    const customerExists = await Customer.findOne({
        type: req.body.type,
        name: req.body.name,
        email: req.body.email, 
        company: req.company._id
    });

    if (customerExists) return res.status(403).json({
        error: 'Customer has already been created. Please verify.'
    });

    var address = new Address({
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country
    });

    _.omit(req.body, ['street', 'city', 'state', 'country']);

    let customer = new Customer(req.body);
    customer.company = req.company._id;
    customer.address = address.toString();
    
    // ssn/tin
    if (!isValid(customer.tin)) {
        return res.status(403).json({
            error: 'invalid entry of SSN/TIN'
        });
    }

    // phone number
    if (req.body.cell) {
        if (!(phone(req.body.cell).length === 0)) {
            customer.cell = phone(req.body.cell)[0];
        } else {
            return res.status(403).json({
                error: 'Invalid cell number'
            });
        }
    }
    if (req.body.home) {
        if (!(phone(req.body.home).length === 0)) {
            customer.home = phone(req.body.home)[0];
        } else {
            return res.status(403).json({
                error: 'Invalid home number'
            });
        }
    }
    if (req.body.work) {
        if (!(phone(req.body.work).length === 0)) {
            customer.work = phone(req.body.work)[0];
        } else {
            return res.status(403).json({
                error: 'Invalid work number'
            });
        }
    }

    customer.save((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.status(200).json({
            customer: result
        });
    });

    // Company.findByIdAndUpdate(req.company._id, {$push: {customers: customer.id }}, (err, result) => {
    //     if (err) {
    //         return res.status(400).json({error: err});
    //     }
    // });
};

// checkIfCustomerExists = async customer => {
//     const customerExists = await Customer.findOne({
//         type: customer.type,
//         name: customer.name,
//         email: customer.email,
//         company: customer.company
//     });
//     return customerExists;
// };

exports.addCustomers = (req, res) => {
    const customers = req.body.customers;
    var customerCounter = 0;
    var errorCounter = customers.length*5;

    customers.forEach(async customer => {
        try {
            const customerExists = await Customer.findOne({
                type: customer.type,
                name: customer.name,
                email: customer.email,
                company: customer.company
            });
    
            if (customerExists) {
                return res.status(403).json({
                    error: 'One or more customer has already been created. Please verify.'
                })
            } else {
                errorCounter--;
            };
            
            // ssn/tin
            if (!isValid(customer.tin)) {
                return res.status(403).json({
                    error: `Invalid entry of SSN/TIN for ${customer.name}`
                });        
            } else {
                errorCounter--;
            }
        
            // phone number
            if (customer.cell) {
                if (!(phone(customer.cell).length === 0)) {
                    errorCounter--;
                    customer.cell = phone(customer.cell)[0];
                } else {
                    return res.status(403).json({
                        error: `Invalid cell number for ${customer.name}`
                    });
                }
            } else {
                errorCounter--;
            }
            if (customer.home) {
                if (!(phone(customer.home).length === 0)) {
                    errorCounter--;
                    customer.home = phone(customer.home)[0];
                } else {
                    return res.status(403).json({
                        error: `Invalid home number for ${customer.name}`
                    });
                }
            } else {
                errorCounter--;
            }
            if (customer.work) {
                if (!(phone(customer.work).length === 0)) {
                    errorCounter--;
                    customer.work = phone(customer.work)[0];
                } else {
                    return res.status(403).json({
                        error: `Invalid work number for ${customer.name}`
                    });
                }
            } else {
                errorCounter--;
            }
    
            if (errorCounter == 0) {
                customers.forEach(async customer => {
                    var address = new Address({
                        street: customer.street,
                        city: customer.city,
                        state: customer.state,
                        country: customer.country
                    });
                
                    _.omit(customer, ['street', 'city', 'state', 'country']);
                
                    let newCustomer = new Customer(customer);
                    newCustomer.company = customer.company;
                    newCustomer.address = address.toString();
                    
                    newCustomer.save((err, result) => {
                        if (err) {
                            return res.status(400).json({
                                error: err
                            });
                        }
                    });
    
                    customerCounter++;
                });
    
                if (customerCounter == customers.length) {
                    res.status(200).json({
                        'message': 'Customers have all been added!'
                    });
                }
            }
        } catch (error) {
            return res.status(400).json({ error });
        }
    });

};

exports.removeCustomer = async (req, res) => {
    let customer = req.customer;

    customer.remove((err, customer) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
    });

    // Company.findByIdAndUpdate(req.company._id, {$pull: {customers: customer.id}}, {new: true}, (err, result) => {
    //     if (err) {
    //         return res.status(400).json({error: err});
    //     }
    // });

    res.json({message: `${customer.name} has been removed!`});
};

exports.removeHandshakesForCustomer = async (req, res, next) => {    
    Handshake.deleteMany({ company: req.company._id, customer: req.customer._id }, err => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
    });
    next();
};

exports.removeTasksForCustomer = async (req, res, next) => {    
    Task.deleteMany({ company: req.company._id, customer: req.customer._id }, err => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
    });
    next();
};

exports.updateCustomer = (req, res, next) => {
    var address = new Address({
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country
    });
    
    _.omit(req.customer, ['street', 'city', 'state', 'country']);
    let customer = req.customer;

    customer = _.extend(customer, req.body); // extend - mutate the source object
    customer.address = address.toString();
    customer.updated = Date.now();
    
    // ssn/tin
    if (!isValid(customer.tin)) {
        return res.status(403).json({
            error: 'invalid entry of SSN/TIN'
        });
    }

    // phone number
    if (req.body.cell) {
        if (!(phone(req.body.cell).length === 0)) {
            customer.cell = phone(req.body.cell)[0];
        } else {
            return res.status(403).json({
                error: 'Invalid cell number'
            });
        }
    }
    if (req.body.home) {
        if (!(phone(req.body.home).length === 0)) {
            customer.home = phone(req.body.home)[0];
        } else {
            return res.status(403).json({
                error: 'Invalid home number'
            });
        }
    }
    if (req.body.work) {
        if (!(phone(req.body.work).length === 0)) {
            customer.work = phone(req.body.work)[0];
        } else {
            return res.status(403).json({
                error: 'Invalid work number'
            });
        }
    }

    customer.save(err => {
        if (err) {
            return res.status(400).json({
                error: "You are not authorized to perform this action"
            });
        }
        res.json({ customer });
    });
};

// comment/uncomment
exports.comment = (req, res) => {
    let comment = req.body.comment;
    comment.postedBy = req.body.userId;

    Customer.findByIdAndUpdate(
        req.body.customerId, 
        {$push: {comments: comment}}, 
        {new: true}
    )
    .populate('comments.postedBy', '_id first_name last_name company')
    .populate('postedBy', '_id first_name last_name company')
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        } else {
            res.json(result);
        }
    });
};

exports.uncomment = (req, res) => {
    let comment = req.body.comment;

    Customer.findByIdAndUpdate(
        req.body.customerId, 
        {$pull: {comments: { _id: comment._id }}}, 
        {new: true}
    )
    .populate('comments.postedBy', '_id first_name last_name company')
    .populate('postedBy', '_id first_name last_name company')
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        } else {
            res.json(result);
        }
    });
};

exports.convertToCustomer = (req, res) => {
    const { isProspect } = req.body;
    let customer = req.customer;

    customer.isProspect = isProspect;
    customer.converted = Date.now();
    customer.save(err => {
        if (err) {
            return res.status(400).json({
                error: "You are not authorized to perform this action"
            });
        }
        res.status(200).json({ customer, message: `Converted prospect to customer` });
    });
};