import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { initializePinecone } from "./services/vectorService.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database
connectDB();

// Initialize Vector DB (Pinecone)
initializePinecone().then(success => {
  if (success) {
    console.log('Vector DB initialized successfully');
  } else {
    console.log('Vector DB not available (check PINECONE_API_KEY and OPENAI_API_KEY)');
  }
});

import commentRoutes from "./routes/comment.routes.js";
app.use("/api/comments", commentRoutes);

import uploadTestRoutes from "./routes/uploadTest.routes.js";
app.use("/api/upload-test", uploadTestRoutes);

import postRoutes from "./routes/post.routes.js";
app.use("/api/posts", postRoutes);

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);

import aiCoachRoutes from "./routes/aiCoachRoutes.js";
app.use("/ai-coach", aiCoachRoutes);

// Goal tracking routes (Vector DB)
import goalRoutes from "./routes/goalRoutes.js";
app.use("/api/goals", goalRoutes);

app.get("/", (req, res) => {
  res.send("Navjivan API Running");
});

const PORT = process.env.PORT || 5000;

// User Routes
import userRoutes from "./routes/userRoutes.js";
app.use("/api/users", userRoutes);

// Duo Mode Routes
import duoRoutes from "./routes/duoRoutes.js";
app.use("/api/duo", duoRoutes);

// Push Notification Scheduler
import { sendDailyMotivationalNotifications } from "./services/pushNotificationService.js";

// Run every 10 minutes (in milliseconds)
const TEN_MINUTES = 10 * 60 * 1000;
setInterval(() => {
    sendDailyMotivationalNotifications();
}, TEN_MINUTES);

// Also run once on startup for testing (after a short delay)
setTimeout(() => {
    console.log('[Scheduler] Running initial push check...');
    sendDailyMotivationalNotifications();
}, 10000);

app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT} across all interfaces (0.0.0.0)`));
