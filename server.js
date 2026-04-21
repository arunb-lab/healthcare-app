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
const allowedOrigins = [
  "http://localhost:5173",
  "hhttps://aakritiapp.netlify.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------
// Routes
// --------------------
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payments", paymentRoutes);

// --------------------
// Root Route
// --------------------
app.get("/", (req, res) => {
  res.send("<h1>Healthcare Appointment System API</h1><p>Status: Running</p><p>Check <a href='/health'>/health</a> for more details.</p>");
});

// --------------------
// Health Check
// --------------------
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
    99: "Uninitialized",
  };

  res.json({
    status: "OK",
    database: statusMap[dbStatus] || "Unknown",
    dbRawState: dbStatus,
    availableEnvKeys: Object.keys(process.env).filter(key => 
      !key.includes("SECRET") && !key.includes("PASS") && !key.includes("KEY")
    ), // Show only safe keys
    message: "Healthcare Appointment System API is running",
    timestamp: new Date()
  });
});

// --------------------
// VERCEL EXPORT (IMPORTANT)
// --------------------
module.exports = app;
