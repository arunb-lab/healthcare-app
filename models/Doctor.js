const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  qualifications: [{ type: String }],
  experience: { type: Number, default: 0 }, // years of experience
  bio: { type: String },
  consultationFee: { type: Number, default: 0, min: 500 },
  isVerified: { type: Boolean, default: false }, // Admin verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: { type: Date },
  availability: {
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }],
  },
  status: {
    type: String,
    enum: ['Available', 'Busy', 'On Leave'],
    default: 'Available'
  },
  clinic: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'Nepal' },
    phone: { type: String },
    email: { type: String }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Doctor", doctorSchema);
