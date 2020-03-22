const jwt = require('jsonwebtoken');
require('dotenv').config();
const expressJwt = require('express-jwt');
const User = require('../models/user');

exports.signUp = async (req, res) => {
    const userExists = await User.findOne({email: req.body.email});
    if (userExists) return res.status(403).json({
        error: 'Email is taken. Please try another email :)'
    });
    const user = await new User(req.body);
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
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
        res.cookie('t', token, {maxAge: 360000});
        const { _id, username, email } = user;
        return res.json({token, user: {_id, username, email}});
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