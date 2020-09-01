const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    address: {
        type: String,
        trim: true,
        required: true
    },
    tin: {
        type: String,
        required: true
    },
    cell: {
        type: String,
        trim: true
    },
    home: {
        type: String,
        trim: true
    },
    work: {
        type: String,
        trim: true
    },
    naics: {
        type: String,
        trim: true
    },
    industry: {
        type: String,
        trim: true
    },
    birthday: {
        type: String,
        trim: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    company: {
        type: ObjectId, 
        ref: 'Company'
    },
    comments: [{
        text: String,
        created: {type: Date, default: Date.now()}, 
        postedBy: {type: ObjectId, ref: 'User'}
    }],
    updated: Date
});

// virtual fields
customerSchema.virtual('id')
.get(function() {
    return this._id;
});

module.exports = mongoose.model("Customer", customerSchema);