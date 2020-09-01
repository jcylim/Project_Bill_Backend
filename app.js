const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// db
mongoose.connect(
    process.env.MONGO_URI, 
    {useNewUrlParser: true})
    .then(() => console.log('DB Connected'));

mongoose.connection.on('error', err => {
    console.log(`DB connection error: ${err.message}`);
});

// bring in routes
const companyRouter = require('./routes/company');
const authRouter = require('./routes/auth');
const taskRouter = require('./routes/task');
const userRouter = require('./routes/user');
const customerRouter = require('./routes/customer');
const handshakeRouter = require('./routes/handshake');

// API docs
app.get('/', (req, res) => {
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

// middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());
app.use('/', authRouter);
app.use('/', customerRouter);
app.use('/', companyRouter);
app.use('/', userRouter);
app.use('/', taskRouter);
app.use('/', handshakeRouter);
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({error: 'Unauthorized to access this page'});
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Node API is listening on port: ${port}`));