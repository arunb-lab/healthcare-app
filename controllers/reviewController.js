const Review = require("../models/Review");
const Appointment = require("../models/Appointment");

// Create review (patient only, after completed appointment)
exports.createReview = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { appointmentId, rating, review } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({ message: "Appointment ID and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorProfileId");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.patientId.toString() !== patientId) {
      return res.status(403).json({ message: "Not your appointment" });
    }
    if (appointment.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed appointments" });
    }

    const existing = await Review.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this appointment" });
    }

    const newReview = new Review({
      appointmentId,
      patientId,
      doctorProfileId: appointment.doctorProfileId._id,
      rating,
      review: (review || "").trim(),
    });
    await newReview.save();

    res.status(201).json({
      message: "Thank you for your feedback!",
      review: {
        id: newReview._id,
        rating: newReview.rating,
        review: newReview.review,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reviews for a doctor (public) - doctorId = Doctor profile _id
exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }
    const reviews = await Review.find({ doctorProfileId: doctorId })
      .populate("patientId", "username")
      .sort({ createdAt: -1 })
      .limit(50);

    const stats = await Review.aggregate([
      { $match: { doctorProfileId: new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const result = {
      reviews: reviews.map((r) => ({
        id: r._id,
        rating: r.rating,
        review: r.review,
        patientName: r.patientId?.username || "Anonymous",
        createdAt: r.createdAt,
      })),
      averageRating: stats[0] ? Math.round(stats[0].averageRating * 10) / 10 : 0,
      totalReviews: stats[0] ? stats[0].totalReviews : 0,
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
