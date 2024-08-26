const jwt = require('jsonwebtoken');

const generateToken = (userId, tokenType = 'access', expiresIn) => {
    const payload = {
        user: {
            id: userId,
        },
        type: tokenType
    };

    if (!expiresIn) {
        expiresIn = tokenType === 'refresh'
            ? process.env.REFRESH_TOKEN_EXPIRES_IN
            : process.env.ACCESS_TOKEN_EXPIRES_IN;
    }

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = generateToken;
