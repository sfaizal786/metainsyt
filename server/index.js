import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import authRoutes from "./routes/Authroutes.js";
import contactsRoutes from "./routes/ContactRoute.js";
import messageRoutes from "./routes/MessageRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import { setupSocket } from "./socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT;
const databaseurl = process.env.DATABASE_URL;

// ✅ CORS config
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

app.use(cookieParser());
app.use(express.json());

// Static file serving
app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channel', channelRoutes);

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

setupSocket(server);

mongoose.connect(databaseurl).then(() => {
  console.log("MongoDB Connected!");
});
