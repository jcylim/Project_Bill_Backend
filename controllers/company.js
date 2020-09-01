const _ = require('lodash');
const { sendEmail } = require("../helpers");
const Company = require('../models/company');
const Customer = require('../models/customer');
const User = require('../models/user');
const Task = require('../models/task');
const Handshake = require('../models/handshake');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const formidable = require('formidable');
const fs = require('fs');

exports.companyById = (req, res, next, id) => {
    Company.findById(id)
    // .populate('tasks', '_id title about postedBy created stage assignedTo')
    // .populate('tasks.postedBy', '_id first_name last_name')
    // .populate('employees', '_id first_name last_name email')
    .exec((err, company) => {
        if (err || !company) {
            return res.status(400).json({
                error: 'Company not found'
            });
        }

        req.company = company; // adds profile object in req with company info
        next();
    });
};

exports.getCompany = (req, res) => {
    req.company.hashed_password = undefined;
    req.company.salt = undefined;
    return res.json(req.company);
};

exports.getBasicCompanyInfo = (req, res) => {
    const company = {
        "id": req.company._id,
        "name": req.company.name,
        "photo": req.company.photo,
        "comments": req.company.comments
    };

    return res.json(company);
};

exports.hasAuthorization = (req, res, next) => {
    const authorized = req.company && req.auth && req.company._id == req.auth._id;

    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

exports.addNewUser = async (req, res) => {
    const userExists = await User.findOne({email: req.body.email});

    if (userExists) return res.status(403).json({
        error: 'Email is taken. Please try another email :)'
    });
    const user = await new User(req.body);
    user.company = req.company._id;
    await user.save();

    // Company.findByIdAndUpdate(req.company._id, {$push: {employees: user.id }}, (err, result) => {
    //     if (err) {
    //         return res.status(400).json({error: err});
    //     }
    // });

    res.status(200).json({ message: 'Added new user successfully!' });
};

// TO-DO: still need to add send signin page to newly added user/employee
exports.addUser = async (req, res) => {
    const { email } = req.body;
    User.findOne({email}, (err, user) => {
        //let isUserInCompany = user && _.some(req.company.employees, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});
        let isUserInCompany = user && String(user.company) === String(req.company._id);

        if (err || isUserInCompany) {
            return res.status(401).json({
                error: 'User is already in company.'
            });
        }

        // Company.findByIdAndUpdate(req.company._id, {$push: {employees: user.id }}, (err, result) => {
        //     if (err) {
        //         return res.status(400).json({error: err});
        //     }
        // });
        user.company = req.company._id;
        user.save();

        res.status(200).json({ message: 'Added user successfully!' });
    });
};

exports.addTask = async (req, res) => {
    const taskExists = await Task.findOne({title: req.body.title, company: req.body.companyId});

    if (taskExists) return res.status(403).json({
        error: 'Task has already been created. Please create another task :)'
    });
    const newTask = await new Task(req.body);
    newTask.company = req.company._id;
    newTask.customer = req.body.customerId;
    await newTask.save();

    // Company.findByIdAndUpdate(req.company._id, {$push: {tasks: newTask.id }}, (err, result) => {
    //     if (err) {
    //         return res.status(400).json({error: err});
    //     }
    // });

    res.status(200).json({ message: 'Added new task successfully!' });
};

// exports.addCustomer = async (req, res) => {
//     let customer = new Customer(req.body);

//     customer.company = req.company._id;

//     const customerExists = await Customer.findOne({name: customer.name, company: req.company._id});

//     if (customerExists) return res.status(403).json({
//         error: 'Customer has already been created. Please verify.'
//     });

//     customer.save((err, result) => {
//         if (err) {
//             return res.status(400).json({
//                 error: err
//             });
//         }
//         res.status(200).json({
//             customer: result
//         });
//     });

//     res.status(200).json({ message: 'Added new customer successfully!' });
// };

exports.allUsers = (req, res) => {
    User.find({company: req.company._id})
        .select('_id first_name last_name email company role photo')
        .sort('_created')
        .exec((err, users) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(users);
        })
};

exports.allTasks = (req, res) => {
    Task.find({company: req.company._id})
        .populate('postedBy', '_id first_name last_name email')
        .populate('assignedTo', '_id first_name last_name email company')
        .select('_id title about assignedTo created updated comments stage company customer handshake')
        .sort('_created')
        .exec((err, tasks) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(tasks);
        })
};

exports.allCustomers = (req, res) => {
    Customer.find({company: req.company._id})
        //.populate('deals', '_id title about assignedTo created updated comments stage company')
        //.populate('deals.assignedTo', '_id first_name last_name email company')
        .select('_id name about email created updated type company address cell home work tin naics industry')
        .sort('_created')
        .exec((err, customers) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(customers);
        })
};

exports.allHandshakes = (req, res) => {
    Handshake.find({company: req.company._id})
        .populate('assignedTo', '_id first_name last_name email company')
        .select('_id title about assignedTo created updated comments stage company customer')
        .sort('_created')
        .exec((err, handshakes) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(handshakes);
        })
};

exports.updateCompany = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }
        // save company
        let company = req.company;
        company = _.extend(company, fields);
 
        company.updated = Date.now();
 
        if (files.photo) {
            company.photo.data = fs.readFileSync(files.photo.path);
            company.photo.contentType = files.photo.type;
        }
 
        company.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            company.hashed_password = undefined;
            company.salt = undefined;
            // console.log("company after update with formdata: ", company);
            res.json(company);
        });
    });
};

// exports.updateCompany = (req, res, next) => {
//     let company = req.company;
//     company = _.extend(company, req.body); // extend - mutate the source object
//     company.updated = Date.now();
//     company.save(err => {
//         if (err) {
//             return res.status(400).json({
//                 error: "You are not authorized to perform this action"
//             });
//         }
//         company.hashed_password = undefined;
//         company.salt = undefined;
//         res.json({ company });
//     });
// };

exports.companyPhoto = (req, res, next) => {
    if (req.company.photo.data) {
        res.set(("Content-Type", req.company.photo.contentType));
        return res.send(req.company.photo.data);
    }
    next();
};

// comment/uncomment
exports.comment = (req, res) => {
    let comment = req.body.comment;

    Company.findByIdAndUpdate(
        req.body.companyId, 
        {$push: {comments: comment}}, 
        {new: true}
    )
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

    Company.findByIdAndUpdate(
        req.body.companyId, 
        {$pull: {comments: { _id: comment._id }}}, 
        {new: true}
    )
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        } else {
            res.json(result);
        }
    });
};