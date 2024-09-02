const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    if (req.path === '/api/users/refresh-token') {
        return next();
    }
    var token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified.user;
        next();
    } catch (err) {
        console.log(err.message);
        res.status(400).json({ message: 'Token Expired' });
    }
};

module.exports = authenticateToken;
