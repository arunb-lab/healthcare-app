const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Review = require("../models/Review");

// Search doctors
exports.searchDoctors = async (req, res) => {
  try {
    const { specialization, name, lat, lng, maxDistance = 10 } = req.query;

    // Build query: only show admin-approved (verified) doctors whose User is active
    const activeDoctorUserIds = await User.find({ role: 'doctor', isActive: { $ne: false } }).distinct('_id');
    let query = { isVerified: true, userId: { $in: activeDoctorUserIds } };

    // Search by specialization
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    // Geolocation search - find nearby doctors
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const distance = parseFloat(maxDistance) * 1000; // Convert km to meters
      
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: distance
        }
      };
    }

    let doctors = await Doctor.find(query)
      .populate('userId', 'username email phone');

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
        totalReviews: r.totalReviews,
        clinic: doctor.clinic,
        location: doctor.location
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
      clinic: doctor.clinic,
      location: doctor.location,
      createdAt: doctor.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get nearby doctors with geolocation
exports.getNearbyDoctors = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10, specialization } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistanceKm = parseFloat(maxDistance);

    // Build query: only show admin-approved (verified) doctors whose User is active
    const activeDoctorUserIds = await User.find({ role: 'doctor', isActive: { $ne: false } }).distinct('_id');
    let query = { 
      isVerified: true, 
      userId: { $in: activeDoctorUserIds },
      location: { $exists: true }
    };

    // Add specialization filter if provided
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    // Get all doctors with location data
    const doctors = await Doctor.find(query)
      .populate('userId', 'username email phone');

    // Calculate distance and filter within radius
    const doctorsList = [];
    const ratingMap = {};
    
    // Get ratings for all doctors
    if (doctors.length > 0) {
      const doctorIds = doctors.map(d => d._id.toString());
      const ratingStats = await Review.aggregate([
        { $match: { doctorProfileId: { $in: doctors.map(d => d._id) } } },
        { $group: { _id: "$doctorProfileId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
      ]);
      ratingStats.forEach(s => {
        ratingMap[s._id.toString()] = {
          averageRating: Math.round(s.avg * 10) / 10,
          totalReviews: s.count
        };
      });
    }

    // Filter doctors within radius and calculate distance
    doctors.forEach(doctor => {
      if (doctor.location && doctor.location.coordinates) {
        const doctorLat = doctor.location.coordinates[1];
        const doctorLng = doctor.location.coordinates[0];
        
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (doctorLat - latitude) * Math.PI / 180;
        const dLng = (doctorLng - longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(doctorLat * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c;
        
        // Only include if within max distance
        if (distanceKm <= maxDistanceKm) {
          const r = ratingMap[doctor._id.toString()] || { averageRating: 0, totalReviews: 0 };
          
          doctorsList.push({
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
            totalReviews: r.totalReviews,
            clinic: doctor.clinic,
            location: doctor.location,
            distance: Math.round(distanceKm * 10) / 10, // Round to 1 decimal place
            unit: 'km'
          });
        }
      }
    });

    // Sort by distance
    doctorsList.sort((a, b) => a.distance - b.distance);

    res.json({
      count: doctorsList.length,
      center: { lat: latitude, lng: longitude },
      searchRadius: maxDistanceKm,
      doctors: doctorsList
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

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
