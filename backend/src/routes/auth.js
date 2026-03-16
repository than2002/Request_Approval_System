const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authmiddleware');


/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', AuthController.register);

/**
 * @route   POST /api/auth/create-manager
 * @desc    Admin endpoint to create privileged users (managers, admins)
 * @access  Private (Admin Only)
 */
router.post('/create-manager', authenticate, authorize('admin'), AuthController.createPrivilegedUser);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in user profile
 * @access  Private
 */
router
  .route('/profile')
  .get(authenticate, AuthController.getProfile)
  .put(authenticate, AuthController.updateProfile);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users
 * @access  Private (Admin Only)
 */
router.get('/users', authenticate, authorize('admin'), AuthController.getAllUsers);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete a user
 * @access  Private (Admin Only)
 */
router.delete('/users/:id', authenticate, authorize('admin'), AuthController.deleteUser);

module.exports = router;