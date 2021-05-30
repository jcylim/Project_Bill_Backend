const _ = require("lodash");
const addressValidator = require('address-validator');
const Address = addressValidator.Address;
const phone = require('phone');
const { sendEmail } = require("../helpers");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const expressJwt = require('express-jwt');
const User = require('../models/user');

exports.signUp = async (req, res) => {
    const userExists = await User.findOne({email: req.body.email});
    if (userExists) return res.status(403).json({
        error: 'Email is taken. Please try another email :)'
    });

    const address = new Address({
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country
    });
    _.omit(req.body, ['street', 'city', 'state', 'country']);

    const user = await new User(req.body);
    user.address = address.toString();

    // phone number
    if (req.body.phone) {
        if (!(phone(req.body.phone).length === 0)) {
            user.phone = phone(req.body.phone)[0];
        } else {
            return res.status(403).json({
                error: 'Invalid phone number'
            });
        }
    }

    await user.save();
    res.status(200).json({ message: 'Signup successful!' });
};

exports.signIn = (req, res) => {
    const { email, password } = req.body;
    User.findOne({email}, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: 'User with that email does not exist. Please sign up.'
            });
        }
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Email and password do not match'
            });
        }
        
        // generate cookie token based on user ID and jwt secret key
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.cookie('t', token, {maxAge: 360000});
        const { _id, first_name, last_name, email, role, type, address, phone, stripeAccountId } = user;
        return res.json({token, user: { _id, first_name, last_name, email, role, type, address, phone, stripeAccountId }});
    });
};

exports.signOut = (req, res) => {
    res.clearCookie('t');
    return res.json({message: 'Signout successfully!'});
};

exports.requireSignIn = expressJwt({
    // if the token is valid, express jwt appends the verified user's ID
    // in an auth key to the request object
    secret: process.env.JWT_SECRET,
    userProperty: 'auth'
});

// add forgotPassword and resetPassword methods
exports.forgotPassword = (req, res) => {
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
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
                process.env.CLIENT_URL
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
 
// to allow user to reset password
// first you will find the user in the database with user's resetPasswordLink
// user model's resetPasswordLink's value must match the token
// if the user's resetPasswordLink(token) matches the incoming req.body.resetPasswordLink(token)
// then we got the right user
 
exports.resetPassword = (req, res) => {
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
                message: `Great! Now you can login with your new password.`
            });
        });
    });
};