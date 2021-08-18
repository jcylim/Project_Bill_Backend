const Post = require('../models/post');
const formidable = require('formidable');
const fs = require('fs');
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const dotenv = require('dotenv');
dotenv.config();

const { sendEmail } = require("../helpers");

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


exports.postById = (req, res, next, id) => {
    Post.findById(id)
        .populate('postedBy', '_id first_name last_name role email stripeAccountId')
        .populate('comments.postedBy', '_id first_name last_name email')
        .select('_id title body price status created likes comments role photo')
        .exec((err, post) => {
            if (err || !post) {
                return res.status(400).json({
                    error: 'Post not found'
                });
            }

            req.post = post;
            next();
        });
};

exports.getPosts = (req, res) => {
    Post.find()
    .populate('postedBy', '_id first_name last_name email role')
    .populate('comments', 'text created')
    .populate('comments.postedBy', '_id first_name last_name email')
    .select('_id title body price status created updated comments likes')
    .sort({ created: -1 })
    .then(posts => {
        res.json(posts);
    })
    .catch(err => console.log(err)); 
};

exports.createPost = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            });
        }

        // post validations
        const { title, body, price } = fields;
 
        if (title.length < 4 || title.length > 150) {
            return res.status(400).json({
                error: 'Title must be between 4 to 150 characters'
            });
        }

        if (body.length < 4 || body.length > 2000) {
            return res.status(400).json({
                error: 'Body must be between 4 to 2000 characters'
            });
        }

        if (isNaN(price)) {
            return res.status(400).json({
                error: 'Price must be a number'
            });
        } else {
            if (price < 1.23) {
                return res.status(400).json({
                    error: 'Price must be equal to or greater than $1.23'
                });
            }
        }

        let post = new Post(fields);
        req.profile.hashed_password = undefined;
        req.profile.salt = undefined;
        post.postedBy = req.profile;

        if (files.photo) {
            try {
                post.photo.data = fs.readFileSync(files.photo.path);
            } catch (err) {
                return res.status(400).json({
                    error: err
                });
            }
            post.photo.contentType = files.photo.type;  
        }
        
        post.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: 'Post could not be saved'
                });
            }
            res.json(result);
        })
    });
};

exports.postsByUser = (req, res) => {
    Post.find({postedBy: req.profile._id})
        .populate('postedBy', '_id first_name last_name email')
        .select('_id title body price status created updated likes stripeAccountId')
        .sort('_created')
        .exec((err, posts) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(posts);
        })
};

exports.isPoster = (req, res, next) => {
    let sameUser = req.post && req.auth && req.post.postedBy._id == req.auth._id;
    let adminUser = req.post && req.auth && req.auth.role === "admin";
    
    // console.log("req.post", req.post, " req.auth ", req.auth);
    // console.log("sameUser?", sameUser);
    // console.log("adminUser?", adminUser);

    let isPoster = sameUser || adminUser;
    
    if (!isPoster) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

exports.updatePost = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }
        // save post
        let post = req.post;
        post = _.extend(post, fields);
 
        post.updated = Date.now();

        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType = files.photo.type;
        }
 
        post.save(err => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(post);
        });
    });
};

exports.deletePost = (req, res) => {
    let post = req.post;
    post.remove((err, post) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json({message: `"${post.title}" post has been removed from database!`});
    })
};

exports.photo = (req, res, next) => {
    res.set('Content-Type', req.post.photo.contentType);
    return res.send(req.post.photo.data);
};

exports.singlePost = (req, res) => {
    return res.json(req.post);
};

// like/unlike
exports.like = (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId, 
        {$push: {likes: req.body.userId}}, 
        {new: true}
    ).exec((err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        }
        res.json(result);
    });
};

exports.unlike = (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId, 
        {$pull: {likes: req.body.userId}}, 
        {new: true}
    ).exec((err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        }
        res.json(result);
    });
};

// comment/uncomment
exports.comment = (req, res) => {
    let comment = req.body.comment;
    comment.postedBy = req.body.userId;

    Post.findByIdAndUpdate(
        req.body.postId, 
        {$push: {comments: comment}}, 
        {new: true}
    )
    .populate('comments.postedBy', '_id first_name last_name email')
    .populate('postedBy', '_id first_name last_name email')
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

    Post.findByIdAndUpdate(
        req.body.postId, 
        {$pull: {comments: { _id: comment._id }}}, 
        {new: true}
    )
    .populate('comments.postedBy', '_id first_name last_name email')
    .populate('postedBy', '_id first_name last_name email')
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({error: err});
        } else {
            res.json(result);
        }
    });
};

exports.setPostStatus = (req, res) => {
    const { status } = req.body;
    let post = req.post;

    post.status = status;
    post.updated = Date.now();
    post.save(err => {
        if (err) {
            return res.status(400).json({
                error: "You are not authorized to perform this action"
            });
        }
        res.status(200).json({ status, message: `Set post to ${status} status` });
    });
};

exports.makePayment = async (req, res) => {
    let convenienceFeePercent = 0.05; // charging 5% for convenience/application fee
    let convenienceFee = 123; // charging $1.23 per transaction

    const { consumer, seller } = req.body;
    let post = req.post;
    const idempotencyKey = uuidv1();

    // return stripe.customers.create({
    //     email: token.email,
    //     source: token.id
    // })
    // .then(customer => {
    //     stripe.charges.create({
    //         amount: post.price * 100,
    //         currency: 'usd',
    //         customer: customer.id,
    //         receipt_email: token.email,
    //         description: `purchase of ${post.title}`
    //         // shipping: {
    //         //     name: token.card.name,
    //         //     address: {
    //         //         country: token.card.address_country
    //         //     }
    //         // }
    //     }, {idempotencyKey})
    // })
    // .then(result => res.status(200).json(result))
    // .catch(err => res.status(400).json({ error: err }));

    await stripe.paymentIntents.create({
        payment_method_types: ['card'],
        amount: post.price * 100,
        currency: 'usd',
        receipt_email: consumer.email,
        //application_fee_amount: post.price * 100 * convenienceFeePercent,
        application_fee_amount: convenienceFee,
        transfer_data: {
          destination: seller.stripeAccountId,
        },
    }, {idempotencyKey})
    .then(result => res.status(200).json({ client_secret: result.client_secret }))
    .catch(err => {
        console.log(`error: ${err}`);
        res.status(400).json({ error: err })
    });
    
};

exports.sendSellerEmail = (req, res) => {
    let { consumer } = req.body;
    let post = req.post;
    const email = post.postedBy.email;

    // seller email data
    const emailData = {
        from: "noreply@homely.com",
        to: email,
        subject: "Produce purchase on Homely",
        text: `${consumer.first_name} ${consumer.last_name} just purchased "${post.title}" from you! Reach out to him/her via 
        ${consumer.email}${consumer.phone ? " or " + consumer.phone + "!" : "!"} Thanks for using Homely! 😊`,
        html: `<p>${consumer.first_name} ${consumer.last_name} just purchased "${post.title}" from you! Reach out to him/her via 
        ${consumer.email}${consumer.phone ? " or " + consumer.phone + "!" : "!"}</p> <p>Thanks for using Homely! 😊</p>`
    };

    sendEmail(emailData);
    res.status(200).json({ message: `Email already sent to ${email}!` });
};