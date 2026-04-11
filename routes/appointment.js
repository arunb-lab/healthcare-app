// backend/routes/appointment.js
const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { authMiddleware } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Book appointment (patient only)
router.post("/book", appointmentController.bookAppointment);

// Get booked slots
router.get("/booked-slots", appointmentController.getBookedSlots);

// Get patient appointments
router.get("/my", appointmentController.getPatientAppointments);

// Get appointment by ID
router.get("/:id", appointmentController.getAppointmentById);

// Cancel appointment (Patient / Doctor / Admin)
router.put("/:id/cancel", appointmentController.cancelAppointment);

// Reschedule appointment
router.put("/:id/reschedule", appointmentController.rescheduleAppointment);

// Doctor: Approve / Reject / Mark completed (order matters - these must be before /:id)
router.put("/:id/approve", appointmentController.approveAppointment);
router.put("/:id/reject", appointmentController.rejectAppointment);
router.put("/:id/complete", appointmentController.markCompleted);
router.post("/:id/prescribe", appointmentController.prescribeAppointment);

module.exports = router;
