const _ = require("lodash");
const { sendEmail } = require("../helpers");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const expressJwt = require('express-jwt');
const Company = require('../models/company');
const User = require('../models/user');


exports.signUp = async (req, res) => {
    const companyExists = await Company.findOne({email: req.body.email});

    if (companyExists) return res.status(403).json({
        error: 'Email is taken. Please try another email :)'
    });
    const company = await new Company(req.body);
    await company.save();
    res.status(200).json({ message: 'Root sign up successful!' });
};

exports.signIn = (req, res) => {
    const { email, password } = req.body;
    Company.findOne({email}, (err, company) => {
        if (err || !company) {
            return res.status(401).json({
                error: 'Root email does not exist. Please sign up.'
            });
        }
        if (!company.authenticate(password)) {
            return res.status(401).json({
                error: 'Root email and password do not match'
            });
        }
        
        // generate cookie token based on company ID and jwt secret key
        const token = jwt.sign({ _id: company._id, role: company.role, company: company._id }, process.env.JWT_SECRET);
        res.cookie('t', token, {maxAge: 360000});
        const { _id, name, email, role } = company;
        return res.json({token, company: {_id, name, email, role}});
    });
};

exports.signOut = (req, res) => {
    res.clearCookie('t');
    return res.json({message: 'Signed out successfully!'});
};

exports.userSignIn = (req, res) => {
    const { email, password } = req.body;
    User.findOne({email}, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: 'Email does not exist. Please contact admin.'
            });
        }

        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Email and password do not match'
            });
        }
        
        // generate cookie token based on company ID and jwt secret key
        const token = jwt.sign({ _id: user._id, role: user.role, company: user.company }, process.env.JWT_SECRET);
        res.cookie('t', token, {maxAge: 360000});
        const { _id, first_name, last_name, email, role, company } = user;
        return res.json({token, user: {_id, first_name, last_name, email, role, company}});
    });
};

exports.requireSignIn = expressJwt({
    // if the token is valid, express jwt appends the verified company's ID
    // in an auth key to the request object
    secret: process.env.JWT_SECRET,
    userProperty: 'auth'
});

exports.isAdmin = (req, res, next) => {
    let adminUser = req.post && req.auth && req.auth.role === "admin";
    
    console.log("req.post", req.post, " req.auth ", req.auth);
    
    if (!adminUser) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

// add forgotPassword and resetPassword methods
exports.forgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: "No request body" });
    if (!req.body.email)
        return res.status(400).json({ message: "No Email in request body" });
 
    console.log("forgot password finding company with that email");
    const { email } = req.body;
    console.log("signin req.body", email);
    // find the company based on email
    Company.findOne({ email }, (err, company) => {
        // if err or no company
        if (err || !company)
            return res.status("401").json({
                error: "Company with that email does not exist!"
            });
 
        // generate a token with company id and secret
        const token = jwt.sign(
            { _id: company._id, iss: "NODEAPI" },
            process.env.JWT_SECRET
        );
 
        // email data
        const emailData = {
            from: "noreply@workflow.com",
            to: email,
            subject: "Password Reset Instructions",
            text: `Please use the following link to reset your password: ${
                process.env.CLIENT_URL
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
                process.env.CLIENT_URL
            }/reset-password/${token}</p>`
        };
 
        return company.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};
 
// to allow company to reset password
// first you will find the company in the database with company's resetPasswordLink
// company model's resetPasswordLink's value must match the token
// if the company's resetPasswordLink(token) matches the incoming req.body.resetPasswordLink(token)
// then we got the right company
 
exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;
 
    Company.findOne({ resetPasswordLink }, (err, company) => {
        // if err or no company
        if (err || !company)
            return res.status("401").json({
                error: "Invalid Link!"
            });
 
        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ""
        };
 
        company = _.extend(company, updatedFields);
        company.updated = Date.now();
 
        company.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Great! Now you can login with your new password.`
            });
        });
    });
};

// add userForgotPassword and userResetPassword methods
exports.userForgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: "No request body" });
    if (!req.body.email)
        return res.status(400).json({ message: "No Email in request body" });
 
    console.log("forgot password finding user with that email");
    const { email } = req.body;
    console.log("signin req.body", email);
    // find the user based on email
    User.findOne({ email }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "User with that email does not exist!"
            });
 
        // generate a token with user id and secret
        const token = jwt.sign(
            { _id: user._id, iss: "NODEAPI" },
            process.env.JWT_SECRET
        );
 
        // email data
        const emailData = {
            from: "noreply@workflow.com",
            to: email,
            subject: "Password Reset Instructions",
            text: `Please use the following link to reset your password: ${
                process.env.CLIENT_URL
            }${
                req.company._id
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
                process.env.CLIENT_URL
            }/${
                req.company._id
            }/reset-password/${token}</p>`
        };
 
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};
 
exports.userResetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;
 
    User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "Invalid Link!"
            });
 
        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ""
        };
 
        user = _.extend(user, updatedFields);
        user.updated = Date.now();
 
        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: "Great! Now you can login with your new password."
            });
        });
    });
};