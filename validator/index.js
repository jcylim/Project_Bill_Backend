exports.createPostValidator = (req, res, next) => {
    // title
    req.check('title', 'Write a title').notEmpty();
    req.check('title', 'Title must be between 4 to 150 characters').isLength({
        min: 4,
        max: 150
    });

    // body
    req.check('body', 'Write a body').notEmpty();
    req.check('body', 'Body must be between 4 to 2000 characters').isLength({
        min: 4,
        max: 2000
    });

    // check for errors
    const errors = req.validationErrors()
    if (errors) {
        const firstError = errors.map(err => err.msg)[0];
        return res.status(400).json({error: firstError})
    }

    // proceed to next middleware
    next();
};

exports.userSignUpValidator = (req, res, next) => {
    // username
    req.check('username', 'Username is required').notEmpty();
    req.check('username', 'Username must be between 4 to 15 characters').isLength({
        min: 4,
        max: 15
    });

    // email
    req.check('email', 'Email is required').notEmpty();
    req.check('email', 'Email must be between 3 to 32 characters')
    .matches(/.+\@.+\..+/)
    .withMessage('Invalid email')
    .isLength({
        min: 3,
        max: 32
    });

    // password
    req.check('password', 'Password is required').notEmpty();
    req.check('password', 'Password must contain at least 6 characters')
    .isLength({ min: 6 })
    .matches(/\d/)
    .withMessage('Password must contain a number');

    // check for errors
    const errors = req.validationErrors()
    if (errors) {
        const firstError = errors.map(err => err.msg)[0];
        return res.status(400).json({error: firstError})
    }

    // proceed to next middleware
    next();
};