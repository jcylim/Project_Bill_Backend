const Task = require('../models/task');
const User = require('../models/user');
const formidable = require('formidable');
const fs = require('fs');
const _ = require('lodash');

exports.taskById = (req, res, next, id) => {
    Task.findById(id)
        .populate('assignedTo', '_id first_name last_name email company')
        .populate('postedBy', '_id first_name last_name email role')
        .populate('comments.postedBy', '_id first_name last_name email role company')
        .exec((err, task) => {
            if (err || !task) {
                return res.status(400).json({
                    error: 'Task not found'
                });
            }

            req.task = task;
            next();
        });
};

exports.hasAuthorization = (req, res, next) => {
    let user = req.profile;
    let isAuth = user && req.auth && user._id == req.auth._id;
    let isUserInCompany = user && String(user.company) === String(req.company._id);
    //let isUserInCompany = user && _.some(req.company.employees, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});

    const authorized = isAuth && isUserInCompany;

    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

exports.getTask = (req, res) => {
    return res.json(req.task);
};

exports.createTask = async (req, res, next) => {
    let task = new Task(req.body);
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;

    task.customer = req.body.customerId;
    task.handshake = req.body.handshakeId;
    task.company = req.company._id;
    task.postedBy = req.profile;

    const taskExists = await Task.findOne({
        title: task.title, 
        company: req.company._id,
        customer: req.body.customerId
    });

    if (taskExists) return res.status(403).json({
        error: 'Task has already been created. Please create another task :)'
    });

    task.save(err => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
    });
    
    if (req.body.userId) {
        Task.findByIdAndUpdate(task.id, {$push: { assignedTo: req.body.userId }}, {new: true})
        .populate('assignedTo', '_id first_name last_name email company')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            res.status(200).json({
                task: result
            });
        });
    } else {
        res.status(200).json({ task });
    }

};

exports.tasksByUser = (req, res) => {
    Task.find({postedBy: req.profile._id})
        .populate('postedBy', '_id first_name last_name')
        .select('_id title about created updated comments stage company deadline')
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

exports.tasksByCustomer = (req, res) => {
    Task.find({company: req.company._id, customer: req.customer._id})
        .populate('postedBy', '_id first_name last_name')
        .select('_id title about created updated comments stage company deadline')
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

exports.tasksByHandshake = (req, res) => {
    console.log(req.handshake._id);
    Task.find({
            company: req.company._id,
            handshake: req.handshake._id,
        })
        .populate('postedBy', '_id first_name last_name')
        .select('_id title about created updated comments stage company handshake deadline')
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

exports.isPoster = (req, res, next) => {
    let sameUser = req.task && req.auth && req.task.postedBy && req.task.postedBy._id == req.auth._id;
    let adminUser = req.task && req.auth && req.auth.role === "admin";
    
    let isPoster = sameUser || adminUser;
    
    if (!isPoster) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

exports.updateTask = (req, res, next) => {
    let task = req.task;
    task = _.extend(task, req.body); // extend - mutate the source object
    task.updated = Date.now();
    task.save(err => {
        if (err) {
            return res.status(400).json({
                error: "You are not authorized to perform this action"
            });
        }
        res.json({ task });
    });
};

exports.deleteTask = (req, res) => {
    let task = req.task;
    task.remove((err, task) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
    });
    
    // Company.findByIdAndUpdate(req.company._id, {$pull: {tasks: task.id}}, {new: true}, (err, result) => {
    //     if (err) {
    //         return res.status(400).json({error: err});
    //     }
    // });

    res.json({message: `${task.title} task has been removed!`});
};

// exports.assignTask = (req, res) => {
//     const { email } = req.body;
//     User.findOne({email}, (err, user) => {
//         let isTaskAssigned = user && _.some(req.task.assignedTo, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});
//         let isUserInCompany = user && _.some(req.company.employees, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});

//         if (err || isTaskAssigned) {
//             return res.status(401).json({
//                 error: 'User is already assigned the task.'
//             });
//         } else if (!isUserInCompany) {
//             return res.status(401).json({
//                 error: 'User is not in this company.'
//             });
//         }

//         Task.findByIdAndUpdate(req.task.id, {$push: {assignedTo: user.id }}, (err, result) => {
//             if (err) {
//                 return res.status(400).json({error: err});
//             }
//             res.status(200).json({ 
//                 result, 
//                 message: 'Assigned task to user successfully!' 
//             });
//         });
//     });
// };

exports.unassignTask = (req, res) => {
    const { email } = req.body;
    User.findOne({email}, (err, user) => {
        let isTaskAssigned = user && _.some(req.task.assignedTo, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});
        let isUserInCompany = user && String(user.company) === String(req.company._id);

        if (err || !isTaskAssigned) {
            return res.status(401).json({
                error: 'User is not assigned the task.'
            });
        } else if (!isUserInCompany) {
            return res.status(401).json({
                error: 'User is not in this company.'
            });
        }

        Task.findByIdAndUpdate(req.task.id, {$pull: {assignedTo: user.id }}, {new: true})
        .populate('assignedTo', '_id first_name last_name email company')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            res.status(200).json({ result });
        });
    });
};

exports.assignTask = (req, res) => {
    const { email } = req.body;
    User.findOne({email}, (err, user) => {
        let isTaskAssigned = user && _.some(req.task.assignedTo, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});
        let isUserInCompany = user && String(user.company) === String(req.company._id);
        //let isUserInCompany = user && _.some(req.company.employees, {"_id": user._id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email});

        if (err || isTaskAssigned) {
            return res.status(401).json({
                error: 'User is already assigned the task.'
            });
        } else if (!isUserInCompany) {
            return res.status(401).json({
                error: 'User is not in this company.'
            });
        }

        Task.findByIdAndUpdate(req.task.id, {$push: {assignedTo: user.id }}, {new: true})
        .populate('assignedTo', '_id first_name last_name email company')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            res.status(200).json({ result });
        });
    });
};

exports.setTaskStage = (req, res) => {
    const { stage } = req.body;
    let task = req.task;

    task.stage = stage;
    task.updated = Date.now();
    task.save(err => {
        if (err) {
            return res.status(400).json({
                error: "You are not authorized to perform this action"
            });
        }
        res.status(200).json({ stage, message: `Set task to ${stage} stage` });
    });
};

exports.photo = (req, res, next) => {
    res.set('Content-Type', req.task.photo.contentType);
    return res.send(req.task.photo.data);
};

// // like/unlike
// exports.like = (req, res) => {
//     Task.findByIdAndUpdate(
//         req.body.taskId, 
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
//     Task.findByIdAndUpdate(
//         req.body.taskId, 
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

    Task.findByIdAndUpdate(
        req.body.taskId, 
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

    Task.findByIdAndUpdate(
        req.body.taskId, 
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