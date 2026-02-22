const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Review = require("../models/Review");

// Search doctors
exports.searchDoctors = async (req, res) => {
  try {
    const { specialization, name } = req.query;

    // Build query: only show admin-approved (verified) doctors whose User is active
    const activeDoctorUserIds = await User.find({ role: 'doctor', isActive: { $ne: false } }).distinct('_id');
    let query = { isVerified: true, userId: { $in: activeDoctorUserIds } };

    // Search by specialization
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    let doctors = await Doctor.find(query)
      .populate('userId', 'username email phone')
      .select('-availability');

    // Filter by name if provided
    if (name) {
      const nameRegex = new RegExp(name, 'i');
      doctors = doctors.filter(doctor =>
        nameRegex.test(doctor.userId.username) ||
        nameRegex.test(doctor.specialization)
      );
    }

    // Get ratings for all doctors
    const doctorIds = doctors.map(d => d._id.toString());
    const ratingStats = await Review.aggregate([
      { $match: { doctorProfileId: { $in: doctors.map(d => d._id) } } },
      { $group: { _id: "$doctorProfileId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const ratingMap = {};
    ratingStats.forEach(s => {
      ratingMap[s._id.toString()] = {
        averageRating: Math.round(s.avg * 10) / 10,
        totalReviews: s.count
      };
    });

    const doctorsList = doctors.map(doctor => {
      const r = ratingMap[doctor._id.toString()] || { averageRating: 0, totalReviews: 0 };
      return {
        id: doctor._id,
        userId: doctor.userId._id,
        name: doctor.userId.username,
        email: doctor.userId.email,
        phone: doctor.userId.phone,
        specialization: doctor.specialization,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        bio: doctor.bio,
        consultationFee: doctor.consultationFee,
        isVerified: doctor.isVerified,
        averageRating: r.averageRating,
        totalReviews: r.totalReviews
      };
    });

    res.json({
      count: doctorsList.length,
      doctors: doctorsList
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get doctor details by ID (only verified doctors are visible to patients for booking)
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id)
      .populate('userId', 'username email phone address isActive')
      .populate('verifiedBy', 'username');

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // Rejected/unverified doctors must not be bookable
    if (!doctor.isVerified) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // Disabled user accounts must not be visible
    if (doctor.userId && doctor.userId.isActive === false) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const ratingStats = await Review.aggregate([
      { $match: { doctorProfileId: doctor._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const r = ratingStats[0] ? { averageRating: Math.round(ratingStats[0].avg * 10) / 10, totalReviews: ratingStats[0].count } : { averageRating: 0, totalReviews: 0 };

    res.json({
      id: doctor._id,
      userId: doctor.userId._id,
      name: doctor.userId.username,
      email: doctor.userId.email,
      phone: doctor.userId.phone,
      address: doctor.userId.address,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      qualifications: doctor.qualifications,
      experience: doctor.experience,
      bio: doctor.bio,
      consultationFee: doctor.consultationFee,
      isVerified: doctor.isVerified,
      verifiedBy: doctor.verifiedBy?.username,
      verifiedAt: doctor.verifiedAt,
      availability: doctor.availability,
      averageRating: r.averageRating,
      totalReviews: r.totalReviews,
      createdAt: doctor.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await Appointment.find({ doctorId: doctorId })
      .populate('patientId', 'username email phone address')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({
      count: appointments.length,
      appointments: appointments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update doctor availability and status
exports.updateAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status, availability } = req.body;

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // Update fields if provided
    if (status) doctor.status = status;
    if (availability) doctor.availability = availability;

    await doctor.save();

    res.json({
      message: "Availability updated successfully",
      status: doctor.status,
      availability: doctor.availability
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get doctor's own profile
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id })
      .populate('userId', 'username email phone address');

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
