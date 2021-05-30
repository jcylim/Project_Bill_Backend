const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { sendEmail } = require("./helpers");

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// db
mongoose.connect(
    process.env.MONGO_URI, 
    {useNewUrlParser: true})
    .then(() => console.log('DB Connected'));

mongoose.connection.on('error', err => {
    console.log(`DB connection error: ${err.message}`);
});

// bring in routes
const postRouter = require('./routes/post');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === "/api/payment/webhook") {
      next();
    } else {
      bodyParser.json()(req, res, next);
    }
});

// set up webhooks for payment fulfillments
app.post('/api/payment/webhook', bodyParser.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
  
    let event;    
    const endpointSecret = process.env.WEBHOOK_ENDPOINT_SECRET;
  
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    const paymentIntent = event.data.object;

    switch (event.type) {
        case 'payment_intent.succeeded':
            handleSuccessfulPaymentIntent(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            console.log(event.type);
            break;
    }
  
    res.json({received: true});
});

const handleSuccessfulPaymentIntent = paymentIntent => {
    // Fulfill the purchase.
    console.log(`💸 PaymentIntent (${paymentIntent.id}): ${paymentIntent.status}`);

    const email = paymentIntent.receipt_email;

    // buyer email data
    const emailData = {
        from: "noreply@homely.com",
        to: email,
        subject: "Your receipt from Homely",
        text: `You have just completed your purchase of a produce from Homely for $${paymentIntent.amount / 100}. The seller will contact you with further details!
        Thanks for using Homely! 😊`,
        html: `<p>You have just completed your purchase of a produce from Homely for $${paymentIntent.amount / 100}. The seller will contact you with further details!</p> 
        <p>Thanks for using Homely! 😊</p>`
    };

    sendEmail(emailData);
    console.log(`Email already sent to ${email}!`)
}

// API docs
app.get('/api', (req, res) => {
    fs.readFile('./docs/apiDocs.json', (err, data) => {
        if (err) {
            res.status(400).json({
                error: err
            });
        }
        const docs = JSON.parse(data);
        res.json(docs);
    });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());
app.use('/api', postRouter);
app.use('/api', authRouter);
app.use('/api', userRouter);
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({error: 'Unauthorized to access this page'});
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🥑🏡🍎 Homely API is listening on port: ${port}`));