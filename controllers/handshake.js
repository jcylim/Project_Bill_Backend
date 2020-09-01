const Handshake = require('../models/handshake');
const Company = require('../models/company');
const User = require('../models/user');
const formidable = require('formidable');
const fs = require('fs');
const _ = require('lodash');

exports.handshakeById = (req, res, next, id) => {
    Handshake.findById(id)
        .populate('assignedTo', '_id first_name last_name email company')
        .populate('comments.postedBy', '_id first_name last_name email role company deadline')
        .exec((err, handshake) => {
            if (err || !handshake) {
                return res.status(400).json({
                    error: 'Handshake not found'
                });
            }

            req.handshake = handshake;
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

exports.getHandshake = (req, res) => {
    return res.json(req.handshake);
};

exports.createHandshake = async (req, res, next) => {
    let handshake = new Handshake(req.body);

    handshake.company = req.company._id;
    handshake.customer = req.body.customerId;

    const handshakeExists = await Handshake.findOne({
        title: handshake.title, 
        company: req.company._id,
        customer: req.body.customerId
    });

    if (handshakeExists) return res.status(403).json({
        error: 'Handshake has already been created. Please create another handshake :)'
    });

    handshake.save((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
    });

    if (req.body.userId) {
        Handshake.findByIdAndUpdate(handshake.id, {$push: { assignedTo: req.body.userId }}, {new: true})
        .populate('assignedTo', '_id first_name last_name email company')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            res.status(200).json({
                handshake: result
            });
        });
    } else {
        res.status(200).json({ handshake });
    }
    
    // Company.findByIdAndUpdate(req.company._id, {$push: { handshakes: handshake.id }}, (err, result) => {
    //     if (err) {
    //         return res.status(400).json({error: err});
    //     }
    // });
};

exports.handshakesByCustomer = (req, res) => {
    Handshake.find({company: req.company._id, customer: req.customer._id})
        .select('_id title about created updated comments stage company deadline')
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

exports.updateHandshake = (req, res, next) => {
    let handshake = req.handshake;
    handshake = _.extend(handshake, req.body); // extend - mutate the source object
    handshake.updated = Date.now();
    handshake.save(err => {
        if (err) {
            return res.status(400).json({
                error: "You are not authorized to perform this action"
            });
        }
        res.json({ handshake });
    });
};

exports.deleteHandshake = (req, res) => {
    let handshake = req.handshake;
    handshake.remove((err, handshake) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
    });
    
    // Company.findByIdAndUpdate(req.company._id, {$pull: {handshakes: handshake.id}}, {new: true}, (err, result) => {
    //     if (err) {
    //         return res.status(400).json({error: err});
    //     }
    // });

    res.json({message: `${handshake.title} handshake has been removed!`});
};

// exports.assignHandshake = (req, res) => {
//     const { email } = req.body;
//     User.findOne({email}, (err, user) => {
//         let isHandshakeAssigned = user && _.some(req.handshake.assignedTo, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});
//         let isUserInCompany = user && _.some(req.company.employees, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});

//         if (err || isHandshakeAssigned) {
//             return res.status(401).json({
//                 error: 'User is already assigned the handshake.'
//             });
//         } else if (!isUserInCompany) {
//             return res.status(401).json({
//                 error: 'User is not in this company.'
//             });
//         }

//         Handshake.findByIdAndUpdate(req.handshake.id, {$push: {assignedTo: user.id }}, (err, result) => {
//             if (err) {
//                 return res.status(400).json({error: err});
//             }
//             res.status(200).json({ 
//                 result, 
//                 message: 'Assigned handshake to user successfully!' 
//             });
//         });
//     });
// };

exports.unassignHandshake = (req, res) => {
    const { email } = req.body;
    User.findOne({email}, (err, user) => {
        let isHandshakeAssigned = user && _.some(req.handshake.assignedTo, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});
        let isUserInCompany = user && String(user.company) === String(req.company._id);

        if (err || !isHandshakeAssigned) {
            return res.status(401).json({
                error: 'User is not assigned the handshake.'
            });
        } else if (!isUserInCompany) {
            return res.status(401).json({
                error: 'User is not in this company.'
            });
        }

        Handshake.findByIdAndUpdate(req.handshake.id, {$pull: { assignedTo: user.id }}, {new: true})
        .populate('assignedTo', '_id first_name last_name email company')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            res.status(200).json({ result });
        });
    });
};

exports.assignHandshake = (req, res) => {
    const { email } = req.body;
    User.findOne({email}, (err, user) => {
        let isHandshakeAssigned = user && _.some(req.handshake.assignedTo, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});
        let isUserInCompany = user && String(user.company) === String(req.company._id);
        //let isUserInCompany = user && _.some(req.company.employees, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});

        if (err || isHandshakeAssigned) {
            return res.status(401).json({
                error: 'User is already assigned the handshake.'
            });
        } else if (!isUserInCompany) {
            return res.status(401).json({
                error: 'User is not in this company.'
            });
        }

        Handshake.findByIdAndUpdate(req.handshake.id, {$push: { assignedTo: user.id }}, {new: true})
        .populate('assignedTo', '_id first_name last_name email company')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            res.status(200).json({ result });
        });
    });
};

exports.setHandshakeStage = (req, res) => {
    const { stage } = req.body;
    let handshake = req.handshake;

    handshake.stage = stage;
    handshake.updated = Date.now();
    handshake.save(err => {
        if (err) {
            return res.status(400).json({
                error: "You are not authorized to perform this action"
            });
        }
        res.status(200).json({ stage, message: `Set handshake to ${stage} stage` });
    });
};

// // like/unlike
// exports.like = (req, res) => {
//     Handshake.findByIdAndUpdate(
//         req.body.handshakeId, 
//         {$push: {likes: req.body.userId}}, 
//         {new: true}
//     ).exec((err, result) => {
//         if (err) {
//             return res.status(400).json({error: err});
//         }
//         res.json(result);
//     });
// };

// exports.unlike = (req, res) => {
//     Handshake.findByIdAndUpdate(
//         req.body.handshakeId, 
//         {$pull: {likes: req.body.userId}}, 
//         {new: true}
//     ).exec((err, result) => {
//         if (err) {
//             return res.status(400).json({error: err});
//         }
//         res.json(result);
//     });
// };

// comment/uncomment
exports.comment = (req, res) => {
    let comment = req.body.comment;
    comment.postedBy = req.body.userId;

    Handshake.findByIdAndUpdate(
        req.body.handshakeId, 
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

    Handshake.findByIdAndUpdate(
        req.body.handshakeId, 
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