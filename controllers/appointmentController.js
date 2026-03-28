const Appointment = require("../models/Appointment");
const Review = require("../models/Review");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

// Book appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason, notes, isEmergency, paymentToken, paymentAmount } = req.body;
    const patientId = req.user.id;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        message: "Doctor ID, appointment date, time, and reason are required"
      });
    }

    // verify payment if token provided (required for production)
    if (!paymentToken || typeof paymentAmount !== 'number') {
      return res.status(400).json({
        message: "Payment token and amount must be provided"
      });
    }

    // dynamic import axios here so we don't add dependency globally
    const axios = require('axios');
    // simple helper to verify with Khalti
    async function verifyKhaltiToken(token, amount) {
      // test mode shortcut
      if (process.env.KHALTI_TEST === 'true' && token === 'test') {
        return { status: 'Test', transaction_id: 'test-transaction', amount };
      }

      const config = {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      };
      const resp = await axios.post('https://khalti.com/api/v2/payment/verify/', { token, amount }, config);
      return resp.data;
    }

    const khaltiResponse = await verifyKhaltiToken(paymentToken, paymentAmount);
    if (!khaltiResponse || khaltiResponse.transaction_id == null) {
      return res.status(402).json({ message: 'Payment verification failed' });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId).populate('userId');
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if patient is trying to book with themselves
    if (doctor.userId._id.toString() === patientId) {
      return res.status(400).json({
        message: "Cannot book appointment with yourself"
      });
    }

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({
        message: "Appointment date and time must be in the future"
      });
    }

    // Check for conflicting appointments 
    const appointmentDateObj = new Date(appointmentDate);
    appointmentDateObj.setHours(0, 0, 0, 0);

    const conflictingAppointment = await Appointment.findOne({
      doctorId: doctor.userId._id,
      appointmentDate: appointmentDateObj,
      appointmentTime: appointmentTime,
      status: { $in: ['payment_pending', 'pending', 'approved'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        message: "This time slot is already booked. Please choose another time."
      });
    }

    // Check if patient already has an appointment at this time
    const patientConflict = await Appointment.findOne({
      patientId: patientId,
      appointmentDate: appointmentDateObj,
      appointmentTime: appointmentTime,
      status: { $in: ['payment_pending', 'pending', 'approved'] }
    });

    if (patientConflict) {
      return res.status(400).json({
        message: "You already have an appointment at this time."
      });
    }

    // verify that amount matches consultation fee (khalti uses paisa, so multiply by 100)
    if (process.env.KHALTI_TEST !== 'true') {
      const expectedAmount = Math.round((doctor.consultationFee || 0) * 100);
      if (paymentAmount !== expectedAmount) {
        return res.status(400).json({ message: 'Paid amount does not match consultation fee' });
      }
    }

    // Create appointment with payment metadata
    const appointment = new Appointment({
      patientId: patientId,
      doctorId: doctor.userId._id,
      doctorProfileId: doctor._id,
      appointmentDate: appointmentDateObj,
      appointmentTime: appointmentTime,
      reason: reason,
      notes: notes || '',
      isEmergency: !!isEmergency,
      consultationFee: doctor.consultationFee,
      payment: {
        status: 'completed',
        provider: 'khalti',
        transactionId: khaltiResponse.transaction_id || khaltiResponse.idx || '',
        amount: paymentAmount,
        raw: khaltiResponse
      },
      status: 'pending'
    });

    await appointment.save();

    // for response
    await appointment.populate('doctorId', 'username email');
    await appointment.populate('patientId', 'username email');

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: {
        id: appointment._id,
        doctor: {
          id: appointment.doctorId._id,
          name: appointment.doctorId.username
        },
        patient: {
          id: appointment.patientId._id,
          name: appointment.patientId.username
        },
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        reason: appointment.reason,
        status: appointment.status,
        consultationFee: appointment.consultationFee,
        payment: appointment.payment
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get patient appointments
exports.getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ patientId: patientId })
      .populate('doctorId', 'username email phone')
      .populate('doctorProfileId', 'specialization consultationFee')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    const completedIds = appointments.filter((a) => a.status === "completed").map((a) => a._id);
    const reviewedIds = await Review.find({ appointmentId: { $in: completedIds } }).distinct("appointmentId");
    const reviewedSet = new Set(reviewedIds.map((id) => id.toString()));

    res.json({
      count: appointments.length,
      appointments: appointments.map(apt => ({
        id: apt._id,
        doctor: {
          id: apt.doctorId._id,
          name: apt.doctorId.username,
          email: apt.doctorId.email,
          phone: apt.doctorId.phone,
          specialization: apt.doctorProfileId?.specialization
        },
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        reason: apt.reason,
        status: apt.status,
        consultationFee: apt.consultationFee,
        payment: apt.payment,
        notes: apt.notes,
        cancellationReason: apt.cancellationReason,
        hasReviewed: apt.status === "completed" ? reviewedSet.has(apt._id.toString()) : false,
        createdAt: apt.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'username')
      .populate('doctorId', 'username');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has permission to cancel
    const isPatient = appointment.patientId._id.toString() === userId;
    const isDoctor = appointment.doctorId._id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        message: "You don't have permission to cancel this appointment"
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        message: "Appointment is already cancelled"
      });
    }

    if (appointment.status === 'completed' || appointment.status === 'rejected') {
      return res.status(400).json({
        message: "Cannot cancel this appointment"
      });
    }

    // Patient can only cancel before appointment time
    if (isPatient) {
      const aptDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      if (aptDateTime <= new Date()) {
        return res.status(400).json({
          message: "Cannot cancel appointment after it has started. Please contact the doctor or admin."
        });
      }
    }

    // Determine who cancelled
    let cancelledBy = 'patient';
    if (isDoctor) cancelledBy = 'doctor';
    if (isAdmin) cancelledBy = 'admin';

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledBy = cancelledBy;
    appointment.cancellationReason = cancellationReason || 'No reason provided';
    appointment.updatedAt = new Date();

    await appointment.save();

    res.json({
      message: "Appointment cancelled successfully",
      appointment: {
        id: appointment._id,
        status: appointment.status,
        cancelledBy: appointment.cancelledBy,
        cancellationReason: appointment.cancellationReason
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'username email phone')
      .populate('doctorId', 'username email phone')
      .populate('doctorProfileId', 'specialization consultationFee');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has permission to view
    const isPatient = appointment.patientId._id.toString() === userId;
    const isDoctor = appointment.doctorId._id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        message: "You don't have permission to view this appointment"
      });
    }

    res.json({
      id: appointment._id,
      patient: {
        id: appointment.patientId._id,
        name: appointment.patientId.username,
        email: appointment.patientId.email,
        phone: appointment.patientId.phone
      },
      doctor: {
        id: appointment.doctorId._id,
        name: appointment.doctorId.username,
        email: appointment.doctorId.email,
        phone: appointment.doctorId.phone,
        specialization: appointment.doctorProfileId.specialization
      },
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      reason: appointment.reason,
      status: appointment.status,
      consultationFee: appointment.consultationFee,
      notes: appointment.notes,
      cancelledBy: appointment.cancelledBy,
      cancellationReason: appointment.cancellationReason,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Doctor: Approve appointment
exports.approveAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.doctorId.toString() !== doctorId) {
      return res.status(403).json({ message: "Not your appointment" });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: "Only pending appointments can be approved" });
    }

    appointment.status = 'approved';
    appointment.updatedAt = new Date();
    await appointment.save();

    res.json({ message: "Appointment approved", appointment: { id: appointment._id, status: appointment.status } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Doctor: Reject appointment
exports.rejectAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.doctorId.toString() !== doctorId) {
      return res.status(403).json({ message: "Not your appointment" });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: "Only pending appointments can be rejected" });
    }

    appointment.status = 'rejected';
    appointment.cancellationReason = reason || "Doctor rejected";
    appointment.updatedAt = new Date();
    await appointment.save();

    res.json({ message: "Appointment rejected", appointment: { id: appointment._id, status: appointment.status } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Doctor: Mark as completed
exports.markCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.doctorId.toString() !== doctorId) {
      return res.status(403).json({ message: "Not your appointment" });
    }
    if (appointment.status !== 'approved') {
      return res.status(400).json({ message: "Only approved appointments can be marked as completed" });
    }

    appointment.status = 'completed';
    appointment.updatedAt = new Date();
    await appointment.save();

    res.json({ message: "Appointment marked as completed", appointment: { id: appointment._id, status: appointment.status } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get booked time slots (doctorId in query = Doctor profile _id)
exports.getBookedSlots = async (req, res) => {
  try {
    const { doctorId: doctorProfileId, date } = req.query;

    if (!doctorProfileId || !date) {
      return res.status(400).json({ message: "Doctor ID and date are required" });
    }

    const doctor = await Doctor.findById(doctorProfileId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const doctorUserId = doctor.userId;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId: doctorUserId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['payment_pending', 'pending', 'approved'] }
    }).select('appointmentTime');

    const bookedSlots = appointments.map(app => app.appointmentTime);
    res.json(bookedSlots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
