const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../uploads/prescriptions");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Get or create conversation (patient can start with doctor they have appointment with)
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { doctorId, patientId } = req.body;

    if (role === "patient") {
      if (!doctorId) return res.status(400).json({ message: "doctorId required" });
      let docUserId = doctorId;
      const doctorProfile = await Doctor.findById(doctorId).select("userId");
      if (doctorProfile?.userId) docUserId = doctorProfile.userId.toString();
      const hasAppointment = await Appointment.findOne({
        patientId: userId,
        $or: [{ doctorId: docUserId }, { doctorProfileId: doctorId }],
        status: { $in: ["pending", "approved", "completed"] },
      });
      if (!hasAppointment) {
        return res.status(403).json({ message: "You can only chat with doctors you have an appointment with" });
      }
      let conv = await Conversation.findOne({ patientId: userId, doctorId: docUserId });
      if (!conv) {
        conv = new Conversation({ patientId: userId, doctorId: docUserId });
        await conv.save();
      }
      await conv.populate("doctorId", "username");
      await conv.populate("patientId", "username");
      return res.json(conv);
    }

    if (role === "doctor") {
      if (!patientId) return res.status(400).json({ message: "patientId required" });
      const hasAppointment = await Appointment.findOne({
        patientId: patientId,
        doctorId: userId,
        status: { $in: ["pending", "approved", "completed"] },
      });
      if (!hasAppointment) {
        return res.status(403).json({ message: "You can only chat with your patients" });
      }
      let conv = await Conversation.findOne({ patientId: patientId, doctorId: userId });
      if (!conv) {
        conv = new Conversation({ patientId: patientId, doctorId: userId });
        await conv.save();
      }
      await conv.populate("doctorId", "username");
      await conv.populate("patientId", "username");
      return res.json(conv);
    }

    return res.status(403).json({ message: "Invalid role" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get patients doctor can chat with (from appointments)
exports.getAvailablePatients = async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Doctor only" });
    const doctorId = req.user.id;
    const appointments = await Appointment.find({
      doctorId,
      status: { $in: ["pending", "approved", "completed"] },
    })
      .populate("patientId", "username email");
    const seen = new Set();
    const patients = [];
    for (const apt of appointments) {
      const pid = apt.patientId?._id?.toString();
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        patients.push({ id: pid, name: apt.patientId.username, email: apt.patientId.email });
      }
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get doctors patient can chat with (from appointments)
exports.getAvailableDoctors = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Patient only" });
    }
    const patientId = req.user.id;
    const appointments = await Appointment.find({
      patientId,
      status: { $in: ["pending", "approved", "completed"] },
    })
      .populate("doctorProfileId", "consultationFee")
      .populate("doctorId", "username email");
    const seen = new Set();
    const doctors = [];
    for (const apt of appointments) {
      const docId = apt.doctorProfileId?._id?.toString();
      if (docId && !seen.has(docId)) {
        seen.add(docId);
        doctors.push({
          id: docId,
          userId: apt.doctorId?._id,
          name: apt.doctorId?.username,
          email: apt.doctorId?.email,
          specialization: apt.doctorProfileId?.specialization,
        });
      }
    }
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List conversations for current user
exports.listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let conversations;
    if (role === "patient") {
      conversations = await Conversation.find({ patientId: userId })
        .populate("doctorId", "username email")
        .sort({ lastMessageAt: -1 });
    } else if (role === "doctor") {
      conversations = await Conversation.find({ doctorId: userId })
        .populate("patientId", "username email")
        .sort({ lastMessageAt: -1 });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant =
      (role === "patient" && conv.patientId.toString() === userId) ||
      (role === "doctor" && conv.doctorId.toString() === userId);
    if (!isParticipant) return res.status(403).json({ message: "Access denied" });

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "username");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send text message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (!content?.trim()) return res.status(400).json({ message: "Message content required" });

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant =
      (role === "patient" && conv.patientId.toString() === userId) ||
      (role === "doctor" && conv.doctorId.toString() === userId);
    if (!isParticipant) return res.status(403).json({ message: "Access denied" });

    const msg = new Message({
      conversationId,
      senderId: userId,
      senderRole: role,
      type: "text",
      content: content.trim(),
    });
    await msg.save();
    await msg.populate("senderId", "username");

    conv.lastMessageAt = new Date();
    await conv.save();

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload medical documents (both doctors and patients)
exports.uploadPrescription = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!["doctor", "patient"].includes(userRole)) {
      return res.status(403).json({ message: "Only doctors and patients can upload documents" });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    // Verify user is part of the conversation
    const isParticipant =
      (userRole === "patient" && conv.patientId.toString() === userId) ||
      (userRole === "doctor" && conv.doctorId.toString() === userId);
    if (!isParticipant) return res.status(403).json({ message: "Not your conversation" });

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = "/uploads/prescriptions/" + path.basename(req.file.path);
    const fileName = req.file.originalname || req.file.filename;

    const msg = new Message({
      conversationId,
      senderId: userId,
      senderRole: userRole,
      type: "prescription",
      prescriptionUrl: fileUrl,
      prescriptionFileName: fileName,
    });
    await msg.save();
    await msg.populate("senderId", "username");

    conv.lastMessageAt = new Date();
    await conv.save();

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
