const express = require('express');
const router = express.Router();
const { initiateKhalti, verifyKhalti } = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Khalti v2: initiate payment → returns payment_url for redirection
router.post('/khalti/initiate', authMiddleware, initiateKhalti);

// Khalti v2: verify payment after redirect (called by PaymentReturn page)
router.post('/khalti/verify', authMiddleware, verifyKhalti);

module.exports = router;
