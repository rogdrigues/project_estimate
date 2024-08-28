const express = require('express');
const { check } = require('express-validator');
const {
    getUsers,
    getUserById,
    loginUser,
    addNewUser,
    refreshAccessToken,
    updateUser,
    deleteUser
} = require('../controllers/userControllers');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

//Get method
router.get('/get-all-users', authenticateToken, getUsers);

router.get('/:userId', authenticateToken, getUserById);

//Post method
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


router.post('/refresh-token', refreshAccessToken);

//Put Method
router.put('/:userId', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('role', 'Role is required').not().isEmpty()
], authenticateToken, updateUser);

//Delete Method
router.delete('/:userId', authenticateToken, deleteUser);


module.exports = router;
