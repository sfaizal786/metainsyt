import { Router } from "express";
import {
  getUserInfo,
  login,
  signup,
  updateProfile,
  addProfileImage,
  removeProfileImage,
  logout,
} from "../controllers/AuthController.js";
import { verifyToken } from "../middleware/Authmiddleware.js";
import multer from "multer";

const authRoutes = Router();

// Configure Multer for profile image uploads
const upload = multer({ dest: "uploads/profiles/" });

// Public routes
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);

// Protected routes
authRoutes.get("/userinfo", verifyToken, getUserInfo);
authRoutes.put("/updateprofile", verifyToken, updateProfile);
authRoutes.post(
  "/addprofileimage",
  verifyToken,
  upload.single("profile-image"),
  addProfileImage
);
authRoutes.delete("/remove-profile-image", verifyToken, removeProfileImage);
authRoutes.post("/logout", verifyToken, logout); // Optional: Add verifyToken here if logout needs token validation

export default authRoutes;
