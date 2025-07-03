import { request, response } from "express";
import User from "../models/usermodel.js";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import { renameSync, unlinkSync } from "fs";
import { ioInstance, getSocketIdFromUserId } from "../socket.js";

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

const createToken = (empid, userId) => {
  return jwt.sign(
    { empid, userId },
    process.env.JWT_KEY,
    { expiresIn: maxAge / 1000 } // expiresIn takes seconds
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge,
};

export const signup = async (request, response, next) => {
  try {
    const { empid, password } = request.body;
    if (!empid || !password) {
      return response.status(400).send("Employee Id and Password are Required.");
    }

    const user = await User.create({ empid, password });

    const token = createToken(empid, user.id);
    response.cookie("jwt", token, cookieOptions);

    return response.status(201).json({
      user: {
        id: user.id,
        empid: user.empid,
        profileSetup: user.profileSetup,
      },
    });
  } catch (err) {
    console.log({ err });
    return response.status(500).send("Internal Server error");
  }
};

export const login = async (request, response, next) => {
  try {
    const { empid, password } = request.body;
    if (!empid || !password) {
      return response.status(400).send("Employee Id and Password are Required.");
    }

    const user = await User.findOne({ empid });
    if (!user) {
      return response.status(404).send("Employee Not Found.");
    }

    const auth = await compare(password, user.password);
    if (!auth) {
      return response.status(400).send("Password is Incorrect");
    }

    const token = createToken(empid, user.id);
    response.cookie("jwt", token, cookieOptions);

    return response.status(200).json({
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
    return response.status(500).send("Internal Server error");
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response.status(404).send("Employee Id Not Found.");
    }

    return response.status(200).json({
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
    return response.status(500).send("Internal Server error");
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const { userId } = request;
    const { firstName, lastName, color } = request.body;

    if (!firstName || !lastName) {
      return response
        .status(400)
        .send("First Name, Last Name and Color are required");
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetup: true },
      { new: true, runValidators: true }
    );

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

    return response.status(200).json({
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
    return response.status(500).send("Internal Server error");
  }
};

export const addProfileImage = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).send("File is Required.");
    }

    const date = Date.now();
    const fileName = "uploads/profiles/" + date + request.file.originalname;
    renameSync(request.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      { image: fileName },
      { new: true, runValidators: true }
    );

    const socketId = getSocketIdFromUserId(request.userId);
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

    return response.status(200).json({
      image: updatedUser.image,
    });
  } catch (err) {
    console.log({ err });
    return response.status(500).send("Internal Server error");
  }
};

export const removeProfileImage = async (request, response, next) => {
  try {
    const { userId } = request;
    const user = await User.findById(userId);
    if (!user) {
      return response.status(400).send("User Not Found");
    }

    if (user.image) {
      unlinkSync(user.image);
    }

    user.image = null;
    await user.save();

    return response.status(200).send("Profile Image Removed Successfully.");
  } catch (err) {
    console.log({ err });
    return response.status(500).send("Internal Server error");
  }
};

export const logout = async (request, response, next) => {
  try {
    response.cookie("jwt", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response.status(200).send("Logout Successful.");
  } catch (err) {
    console.log({ err });
    return response.status(500).send("Internal Server error");
  }
};
