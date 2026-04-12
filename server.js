const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const connectDB = require("./db");
const userRoutes = require("./routes/user");
const patientRoutes = require("./routes/patient");
const doctorRoutes = require("./routes/doctor");
const appointmentRoutes = require("./routes/appointment");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/review");
const chatRoutes = require("./routes/chat");
const paymentRoutes = require("./routes/payment");
const ensureAdmin = require("./utils/ensureAdmin");
require("dotenv").config();

// Connect to MongoDB
connectDB();
// Ensure admin exists (from .env)
ensureAdmin().catch((err) => console.error("[ADMIN] Seed error:", err));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/users", userRoutes);
app.use("/patients", patientRoutes);
app.use("/doctors", doctorRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/admin", adminRoutes);
app.use("/reviews", reviewRoutes);
app.use("/chat", chatRoutes);
app.use("/payments", paymentRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Healthcare Appointment System API is running" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
