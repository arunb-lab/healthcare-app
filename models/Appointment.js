const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  additionalDoctors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    doctorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    }
  }],
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['payment_pending', 'pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    provider: {
      type: String,
      default: 'khalti'
    },
    pidx: String,           // Khalti v2 payment index
    transactionId: String,
    amount: Number,
    raw: mongoose.Schema.Types.Mixed
  },
  notes: {
    type: String
  },
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      duration: String,
      instruction: String
    }],
    advice: String,
    prescribedAt: Date,
    isPrescribed: {
      type: Boolean,
      default: false
    }
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'admin']
  },
  cancellationReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ isEmergency: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
