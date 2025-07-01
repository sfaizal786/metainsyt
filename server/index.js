import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from "mongoose";
import authroutes from "./routes/Authroutes.js";
import contactsRoutes from "./routes/ContactRoute.js";
import {setupSocket} from "./socket.js";
import messageRoutes from "./routes/MessageRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const databaseurl = process.env.DATABASE_URL;

app.use(cors({
    origin: [process.env.ORIGIN || "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authroutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channel', channelRoutes);

mongoose.connect(databaseurl)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});

setupSocket(server);
