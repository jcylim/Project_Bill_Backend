const _ = require('lodash');
const addressValidator = require('address-validator');
const Address = addressValidator.Address;
const phone = require('phone');
const User = require('../models/user');
const formidable = require('formidable');
const fs = require('fs');

exports.userById = (req, res, next, id) => {
    User.findById(id)
    // populate followers and following users array
    .populate('following', '_id first_name last_name')
    .populate('followers', '_id first_name last_name')
    .exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }

        req.profile = user; // adds profile object in req with user info
        next();
    });
};

exports.hasAuthorization = (req, res, next) => {
    const authorized = req.profile && req.auth && req.profile._id == req.auth._id;
    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

exports.allUsers = (req, res) => {
    User.find((err, users) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }

        res.json(users);
    }).select('first_name last_name email created updated role type address phone');
};

exports.allChefs = (req, res) => {
    User.find((err, users) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }

        let chefs = users.filter(user => user.type === "chef");

        res.json(chefs);
    }).select('first_name last_name email created updated role type address phone');
};

exports.allFoodSuppliers = (req, res) => {
    User.find((err, users) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }

        let foodSuppliers = users.filter(user => user.type === "local food supplier");

        res.json(foodSuppliers);
    }).select('first_name last_name email created updated role type address phone');
};

exports.getUser = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

exports.updateUser = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }
        
        // save user
        let user = req.profile;
        let street = user.address.split(',')[0].trim();
        let city = user.address.split(',')[1].trim();
        let state = user.address.split(',')[2].trim();
        let country = user.address.split(',')[3].trim();

        if (fields.street || fields.city || fields.state || fields.country) {
            let newStreet = fields.street ? fields.street : street;
            let newCity = fields.city ? fields.city : city;
            let newState = fields.state ? fields.state : state;
            let newCountry = fields.country ? fields.country : country;

            const address = new Address({
                street: newStreet,
                city: newCity,
                state: newState,
                country: newCountry
            });
            _.omit(fields, ['street', 'city', 'state', 'country']);
            fields.address = address.toString();
        }
    
        // phone number
        if (fields.phone) {
            if (!(phone(fields.phone).length === 0)) {
                fields.phone = phone(fields.phone)[0];
            } else {
                return res.status(403).json({
                    error: 'Invalid phone number'
                });
            }
        }

        // console.log("user in update: ", user);
        user = _.extend(user, fields);
 
        user.updated = Date.now();
        // console.log("USER FORM DATA UPDATE: ", user);
 
        if (files.photo) {
            user.photo.data = fs.readFileSync(files.photo.path);
            user.photo.contentType = files.photo.type;
        }
 
        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            user.hashed_password = undefined;
            user.salt = undefined;
            // console.log("user after update with formdata: ", user);
            res.json(user);
        });
    });
};

exports.deleteUser = (req, res) => {
    let user = req.profile;
    user.remove((err, user) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json({message: `${user.first_name} ${user.last_name} has been removed from database!`});
    })
};

exports.userPhoto = (req, res, next) => {
    if (req.profile.photo.data) {
        res.set(("Content-Type", req.profile.photo.contentType));
        return res.send(req.profile.photo.data);
    }
    next();
};

// follow unfollow
exports.addFollowing = (req, res, next) => {
    User.findByIdAndUpdate(req.body.userId, {$push: {following: req.body.followId}}, (err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        }
        next();
    });
};

exports.addFollower = (req, res) => {
    User.findByIdAndUpdate(req.body.followId, {$push: {followers: req.body.userId}}, {new: true})
    .populate('following', '_id first_name last_name')
    .populate('followers', '_id first_name last_name')
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        result.hashed_password = undefined;
        result.salt = undefined;
        res.json(result);
    })
};

exports.removeFollowing = (req, res, next) => {
    User.findByIdAndUpdate(req.body.userId, {$pull: {following: req.body.unfollowId}}, (err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        }
        next();
    });
};

exports.removeFollower = (req, res) => {
    User.findByIdAndUpdate(req.body.unfollowId, {$pull: {followers: req.body.userId}}, {new: true})
    .populate('following', '_id first_name last_name')
    .populate('followers', '_id first_name last_name')
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        result.hashed_password = undefined;
        result.salt = undefined;
        res.json(result);
    })
};

exports.findPeople = (req, res) => {
    let following = req.profile.following;
    following.push(req.profile._id);
    User.find({ _id: {$nin: following} }, (err, users) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json(users);
    }).select('first_name last_name');
};