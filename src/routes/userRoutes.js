const express = require('express');
const { check } = require('express-validator');
const {
    getUsers,
    getUserById,
    loginUser,
    addNewUser,
    refreshAccessToken,
    updateUser,
    deleteUser,
    restoreUser,
    exportUsers,
    importUsers
} = require('../controllers/userControllers');
const authenticateToken = require('../middlewares/authenticateToken');
const { getAllRoles } = require('../controllers/permissionSetControllers');

const router = express.Router();

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

router.post('/import-users', importUsers); // Import users from Excel

//Put Method
router.put('/:userId', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('role', 'Role is required').not().isEmpty()
], authenticateToken, updateUser);

//Delete Method
router.delete('/:userId', authenticateToken, deleteUser);
router.delete('/restore/:userId', authenticateToken, restoreUser);

//Get method
router.get('/export-users', exportUsers); // Export users to Excel

router.get('/roles', authenticateToken, getAllRoles);

router.get('/get-all-users', authenticateToken, getUsers);

router.get('/:userId', authenticateToken, getUserById);

module.exports = router;
