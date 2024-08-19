const jwt = require('jsonwebtoken');

const generateToken = (userId, expiresIn = '1h') => {
    const payload = {
        user: {
            id: userId,
        },
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = generateToken;
