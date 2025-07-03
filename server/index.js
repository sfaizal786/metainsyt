import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from "mongoose";
import authroutes from "./routes/Authroutes.js";
import contactsRoutes from "./routes/ContactRoute.js";
import { setupSocket } from "./socket.js";
import messageRoutes from "./routes/MessageRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const databaseurl = process.env.DATABASE_URL;

// ✅ CORS config
app.use(cors({
  origin: [process.env.ORIGIN], 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true, 
}));

// ✅ Serve static files
app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

// ✅ Parse cookies and JSON
app.use(cookieParser());
app.use(express.json());

// ✅ Your routes
app.use('/api/auth', authroutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channel', channelRoutes);

// ✅ Connect to database
mongoose.connect(databaseurl)
  .then(() => {
    console.log("MongoDB connected");
    // Only start server after DB connection
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      setupSocket(server);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
