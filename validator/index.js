exports.createTaskValidator = (req, res, next) => {
    // title
    req.check('title', 'Write a task title').notEmpty();
    req.check('title', 'Title must be between 4 to 150 characters').isLength({
        min: 4,
        max: 150
    });

    // body
    req.check('about', 'Write a description for the task').notEmpty();
    req.check('about', 'Body must be between 4 to 100 characters').isLength({
        min: 4,
        max: 100
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

exports.companySignUpValidator = (req, res, next) => {
    // name
    req.check('name', 'Company name is required').notEmpty();
    req.check('name', 'Company name must be between 4 to 15 characters').isLength({
        min: 4,
        max: 15
    });

    // about
    req.check('about', 'Company description is required').notEmpty();

    // email
    req.check('email', 'Email is required').notEmpty();
    req.check('email', 'Email must be between 3 to 32 characters')
    .matches(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
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

exports.passwordResetValidator = (req, res, next) => {
    // check for password
    req.check("newPassword", "Password is required").notEmpty();
    req.check("newPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 chars long")
        .matches(/\d/)
        .withMessage("must contain a number")
        .withMessage("Password must contain a number");
 
    // check for errors
    const errors = req.validationErrors();
    // if error show the first one as they happen
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    // proceed to next middleware or ...
    next();
};

exports.createCustomerValidator = (req, res, next) => {
    // name
    req.check('name', 'Customer name is required').notEmpty();
    req.check('name', 'Customer name must be between 4 to 20 characters').isLength({
        min: 4,
        max: 20
    });

    // about
    req.check('about', 'Customer description is required').notEmpty();

    // email
    req.check('email', 'Email is required').notEmpty();
    req.check('email', 'Email must be between 3 to 32 characters')
    .matches(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
    .withMessage('Invalid email')
    .isLength({
        min: 3,
        max: 32
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

exports.createCustomersValidator = (req, res, next) => {
    let customers = req.body.customers;
    
    customers.forEach(customer => {
        // name
        if (!customer.name) {
            return res.status(403).json({
                error: 'Customer name is required'
            });
        } else {
            if (customer.name.length < 4 || customer.name.length > 20) {
                return res.status(403).json({
                    error: 'Customer name must be between 4 to 20 characters'
                });
            } 
        }

        // about
        if (!customer.about) {
            return res.status(403).json({
                error: 'Customer description is required'
            });
        }

        // email
        if (!customer.email) {
            return res.status(403).json({
                error: 'Email is required'
            });
        } else {
            const regex = new RegExp("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
            if (customer.email.length < 3 || customer.email.length > 32) {
                return res.status(403).json({
                    error: 'Email must be between 3 to 32 characters'
                });
            }
            if (!regex.test(customer.email)) {
                return res.status(403).json({
                    error: 'Invalid email'
                });
            }
        }
    });

    // proceed to next middleware
    next();
};

exports.createHandshakeValidator = (req, res, next) => {
    // title
    req.check('title', 'Write a handshake title').notEmpty();
    req.check('title', 'Title must be between 4 to 150 characters').isLength({
        min: 4,
        max: 150
    });

    // body
    req.check('about', 'Write a description for the handshake').notEmpty();
    req.check('about', 'Body must be between 4 to 100 characters').isLength({
        min: 4,
        max: 100
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