const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    deadline: {
        type: String,
        required: true
    },
    postedBy: {
        type: ObjectId,
        ref: 'User'
    },
    created: {
        type: Date,
        default: Date.now
    },
    stage: {
        type: String,
        default: 'NOT STARTED'
    },
    company: {
        type: ObjectId, 
        ref: 'Company'
    },
    customer: {
        type: ObjectId, 
        ref: 'Customer'
    },
    handshake: {
        type: ObjectId, 
        ref: 'Handshake'
    },
    updated: Date,
    assignedTo: [{
        type: ObjectId,
        ref: 'User'
    }],
    // likes: [{type: ObjectId, ref: 'User'}],
    comments: [{
        text: String,
        created: {type: Date, default: Date.now()}, 
        postedBy: {type: ObjectId, ref: 'User'}
    }]
});

// virtual fields
taskSchema.virtual('id')
.get(function() {
    return this._id;
});

module.exports = mongoose.model("Task", taskSchema);