const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Public: Get doctor reviews
router.get("/doctor/:doctorId", reviewController.getDoctorReviews);

// Protected: Create review (patient)
router.post("/", authMiddleware, reviewController.createReview);

module.exports = router;
