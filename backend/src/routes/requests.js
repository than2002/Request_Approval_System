const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authmiddleware');
const RequestController = require('../controllers/requestController');

// All routes require authentication
router.use(authenticate);

// Create Request
router.post('/', RequestController.createRequest);

// Get all user requests
router.get('/', RequestController.getUserRequests);

// Get single request
router.get('/:id', RequestController.getRequestById);

// Update request
router.put('/:id', RequestController.updateRequest);

// Submit request for approval
router.patch('/:id/submit', RequestController.submitRequest);

// Delete request
router.delete('/:id', RequestController.deleteRequest);

module.exports = router;