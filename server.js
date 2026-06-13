/**
 * DairyFlow Backend Server
 */

// ─────────────────────────────────────
// Load ENV First
// ─────────────────────────────────────
import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────
// Imports
// ─────────────────────────────────────
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/auth.js";
import distributorRoutes from "./routes/distributors.js";
import milkCollectionRoutes from "./routes/milkCollections.js";
import paymentRoutes from "./routes/payments.js";
import expenseRoutes from "./routes/expenses.js";
import inventoryRoutes from "./routes/inventory.js";
import analyticsRoutes from "./routes/analytics.js";
import notificationRoutes from "./routes/notifications.js";
import clientRoutes from "./routes/clients.js";
import salesRoutes from "./routes/sales.js";
import productionRoutes from "./routes/production.js";
import receiptRoutes from "./routes/receipts.js";
import reportRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";

// ─────────────────────────────────────
// App Setup
// ─────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://milkproductio.netlify.app"
    ],
    credentials: true,
  })
);
// ─────────────────────────────────────
// Rate Limiter
// ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Too many requests",
  },
});

app.use("/api", limiter);

// ─────────────────────────────────────
// Body Parser
// ─────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────
// Logger
// ─────────────────────────────────────
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// ─────────────────────────────────────
// Health Route
// ─────────────────────────────────────
// Health Route
// ─────────────────────────────────────

app.get("/", (req, res) => {
  res.send("🥛 DairyFlow Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DairyFlow API Running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
// ─────────────────────────────────────
// Routes
// ─────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/distributors", distributorRoutes);
app.use("/api/milk-collections", milkCollectionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

// ─────────────────────────────────────
// Error Handling
// ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────
// Start Server
// ─────────────────────────────────────
const startServer = async () => {
  try {
    console.log("🔄 Connecting MongoDB...");

    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════╗
║      🥛 DairyFlow Backend          ║
╠════════════════════════════════════╣
║ ✅ Port : ${PORT}
║ 🌍 Mode : ${process.env.NODE_ENV}
║ 🔗 URL  : http://localhost:${PORT}
╚════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Server Failed");
    console.error(error);

    process.exit(1);
  }
};

// ─────────────────────────────────────
// Shutdown Events
// ─────────────────────────────────────
process.on("SIGINT", () => {
  console.log("🛑 Server stopped");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("🛑 Server terminated");
  process.exit(0);
});

// ─────────────────────────────────────
// Start App
// ─────────────────────────────────────
startServer();

export default app;