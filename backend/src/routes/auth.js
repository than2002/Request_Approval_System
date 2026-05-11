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
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password/:token', AuthController.resetPassword);

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
 * @route   PUT /api/auth/users/:id/approve
 * @desc    Approve a user
 * @access  Private (Admin Only)
 */
router.put('/users/:id/approve', authenticate, authorize('admin'), AuthController.approveUser);
router.put('/users/:id/toggle-status', authenticate, authorize('admin'), AuthController.toggleUserStatus);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete a user
 * @access  Private (Admin Only)
 */
router.delete('/users/:id', authenticate, authorize('admin'), AuthController.deleteUser);

module.exports = router;