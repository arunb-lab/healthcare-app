// const express = require("express");
// const path = require("path");
// const cors = require("cors");
// const app = express();
// const connectDB = require("./db");
// const userRoutes = require("./routes/user");
// const patientRoutes = require("./routes/patient");
// const doctorRoutes = require("./routes/doctor");
// const appointmentRoutes = require("./routes/appointment");
// const adminRoutes = require("./routes/admin");
// const reviewRoutes = require("./routes/review");
// const chatRoutes = require("./routes/chat");
// const paymentRoutes = require("./routes/payment");
// const ensureAdmin = require("./utils/ensureAdmin");
// require("dotenv").config();

// // // Connect to MongoDB
// // connectDB();
// // // Ensure admin exists (from .env)
// // ensureAdmin().catch((err) => console.error("[ADMIN] Seed error:", err));

// connectDB()
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("DB connection error:", err));

// ensureAdmin().catch((err) => console.error("[ADMIN] Seed error:", err));
// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:5173",
//   credentials: true
// }));
// app.use(express.json());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Routes
// app.use("/users", userRoutes);
// app.use("/patients", patientRoutes);
// app.use("/doctors", doctorRoutes);
// app.use("/appointments", appointmentRoutes);
// app.use("/admin", adminRoutes);
// app.use("/reviews", reviewRoutes);
// app.use("/chat", chatRoutes);
// app.use("/payments", paymentRoutes);

// // Health check route
// // app.get("/health", (req, res) => {
// //   res.json({ status: "OK", message: "Healthcare Appointment System API is running" });
// // });

// // // Start server
// // const PORT = process.env.PORT || 3000;
// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// // });


// // Health check route
// app.get("/health", (req, res) => {
//   res.json({ status: "OK", message: "Healthcare Appointment System API is running" });
// });

// // IMPORTANT for Vercel
// module.exports = app;



const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// DB + Utils
const connectDB = require("./db");
const ensureAdmin = require("./utils/ensureAdmin");

// Routes
const userRoutes = require("./routes/user");
const patientRoutes = require("./routes/patient");
const doctorRoutes = require("./routes/doctor");
const appointmentRoutes = require("./routes/appointment");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/review");
const chatRoutes = require("./routes/chat");
const paymentRoutes = require("./routes/payment");

// --------------------
// SAFE DB INIT (Vercel friendly)
// --------------------
let dbConnected = false;

const initDB = async () => {
  if (dbConnected) return;

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await connectDB();
    dbConnected = true;
    console.log("MongoDB connected");

    await ensureAdmin();
  } catch (err) {
    console.error("DB Initialization Error:", err.message);
  }
};

// Run DB init (safe for serverless)
initDB();

// --------------------
// Middleware
// --------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://aakriti-kafle-healthcare-appointment.netlify.app"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://aakriti-kafle-healthcare-appointment.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------
// Routes
// --------------------
app.use("/users", userRoutes);
app.use("/patients", patientRoutes);
app.use("/doctors", doctorRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/admin", adminRoutes);
app.use("/reviews", reviewRoutes);
app.use("/chat", chatRoutes);
app.use("/payments", paymentRoutes);

// --------------------
// Health Check
// --------------------
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Healthcare Appointment System API is running",
  });
});

// --------------------
// VERCEL EXPORT (IMPORTANT)
// --------------------
module.exports = app;