const express = require('express');
const { check } = require('express-validator');
const { loginUser, refreshAccessToken, addNewUser } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();
1
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], loginUser);

router.post('/add-user', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty()
], authenticateToken, addNewUser);

// Refresh access token
router.post('/refresh-token', refreshAccessToken);

module.exports = router;
