import User from "../models/usermodel.js";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import { renameSync, unlinkSync } from "fs";
import { ioInstance, getSocketIdFromUserId } from "../socket.js"; // Adjust path if needed

const maxAgeSeconds = 3 * 24 * 60 * 60; // 3 days in seconds

const createToken = (empid, userId) => {
  return jwt.sign({ empid, userId }, process.env.JWT_KEY, { expiresIn: maxAgeSeconds });
};

// Middleware to protect routes and set req.userId
export const requireAuth = (req, res, next) => {
  const token = req.cookies?.jwt;
  if (!token) return res.status(401).send("Unauthorized");

  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) return res.status(401).send("Unauthorized");
    req.userId = decoded.userId;
    next();
  });
};

export const signup = async (req, res) => {
  try {
    const { empid, password } = req.body;
    if (!empid || !password) {
      return res.status(400).send("Employee Id and Password are Required.");
    }
    const user = await User.create({ empid, password });
    const token = createToken(empid, user.id);
res.cookie("jwt", token, {

  maxAge: 3 * 24 * 60 * 60 * 1000,
});

    return res.status(201).json({
      user: {
        id: user.id,
        empid: user.empid,
        profileSetup: user.profileSetup,
      },
    });
  } catch (err) {
    console.log({ err });
    return res.status(500).send("Internal Server error");
  }
};

export const login = async (req, res) => {
  try {
    const { empid, password } = req.body;
    if (!empid || !password) {
      return res.status(400).send("Employee Id and Password are Required.");
    }
    const user = await User.findOne({ empid });
    if (!user) {
      return res.status(404).send("Employee Not Found.");
    }
    const auth = await compare(password, user.password);
    if (!auth) {
      return res.status(400).send("Password is Incorrect");
    }
    const token = createToken(empid, user.id);
res.cookie("jwt", token, {
+
  maxAge: 3 * 24 * 60 * 60 * 1000,
});


    return res.status(200).json({
      user: {
        id: user.id,
        empid: user.empid,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (err) {
    console.log({ err });
    return res.status(500).send("Internal Server error");
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const userData = await User.findById(req.userId);
    if (!userData) return res.status(404).send("Employee Id Not Found.");
    return res.status(200).json({
      id: userData.id,
      empid: userData.empid,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (err) {
    console.log({ err });
    return res.status(500).send("Internal Server error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;

    if (!firstName || !lastName || !color)
      return res.status(400).send("First Name, Last Name and Color are required");

    const userData = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetup: true },
      { new: true, runValidators: true }
    );

    // Emit socket event to notify profile update
    const socketId = getSocketIdFromUserId(userId);
    if (ioInstance && socketId) {
      ioInstance.to(socketId).emit("profile-updated", {
        id: userData.id,
        empid: userData.empid,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
      });
    }

    return res.status(200).json({
      id: userData.id,
      empid: userData.empid,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (err) {
    console.log({ err });
    return res.status(500).send("Internal Server error");
  }
};

export const addProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("File is Required.");
    }
    const date = Date.now();
    const fileName = "uploads/profiles/" + date + req.file.originalname;
    renameSync(req.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { image: fileName },
      { new: true, runValidators: true }
    );

    // Emit socket event to notify profile image update
    const socketId = getSocketIdFromUserId(req.userId);
    if (ioInstance && socketId) {
      ioInstance.to(socketId).emit("profile-updated", {
        id: updatedUser.id,
        empid: updatedUser.empid,
        profileSetup: updatedUser.profileSetup,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        image: updatedUser.image,
        color: updatedUser.color,
      });
    }

    return res.status(200).json({ image: updatedUser.image });
  } catch (err) {
    console.log({ err });
    return res.status(500).send("Internal Server error");
  }
};

export const removeProfileImage = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send("User Not Found");
    }
    if (user.image) {
      unlinkSync(user.image);
    }
    user.image = null;
    await user.save();
    return res.status(200).send("Profile Image Removed Successfully.");
  } catch (err) {
    console.log({ err });
    return res.status(500).send("Internal Server error");
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 1,
     
  
    });
    return res.status(200).send("Logout Successful.");
  } catch (err) {
    console.log({ err });
    return res.status(500).send("Internal Server error");
  }
};
