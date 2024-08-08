import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import HttpError from "../models/errorModel.js";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// Register a new user
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;

    if (!name || !email || !password || !password2) {
      return next(new HttpError("Please fill in all fields", 422));
    }

    const newEmail = email.toLowerCase();

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new HttpError("Email already exists", 422));
    }

    if (password.trim().length < 6) {
      return next(new HttpError("Password must be at least 6 characters", 422));
    }

    if (password !== password2) {
      return next(new HttpError("Passwords do not match", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: newEmail,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json(`New user ${user.email} registered successfully`);
  } catch (error) {
    console.error("Registration error:", error); // Debugging line
    return next(new HttpError("Registration failed, please try again", 500));
  }
};

// Login a registered user
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Please fill in all fields", 422));
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return next(new HttpError("Invalid credentials", 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new HttpError("Invalid credentials", 401));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, user: { id, name } });
  } catch (error) {
    console.error("Login error:", error); // Debugging line
    return next(new HttpError("Login failed, please try again", 500));
  }
};

// Get User Profile
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new HttpError("Invalid user ID", 400));
    }
    const user = await User.findById(id).select("-password");
    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return next(new HttpError("Error fetching user profile", 500));
  }
};

// Change User Avatar Picture
const changeAvatar = async (req, res, next) => {
  try {
    console.log("Files in request:", req.files); // Debugging line

    if (!req.files || !req.files.avatar) {
      return next(new HttpError("Please choose an image", 422));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    if (user.avatar) {
      const avatarPath = path.resolve("uploads", user.avatar);
      console.log("Deleting avatar at:", avatarPath); // Debugging line
      try {
        await fs.unlink(avatarPath);
      } catch (err) {
        console.error("Error deleting previous avatar:", err);
      }
    }

    const avatar = req.files.avatar;
    console.log("Avatar file details:", avatar); // Debugging line

    if (avatar.size > 1024 * 1024) {
      return next(new HttpError("Image size too large", 422));
    }

    const fileName = avatar.name;
    const splittedFilename = fileName.split(".");
    const newFilename = `${splittedFilename[0]}_${uuidv4()}.${splittedFilename.pop()}`;

    const newFilePath = path.resolve("uploads", newFilename);
    console.log("Saving new avatar at:", newFilePath); // Debugging line
    await avatar.mv(newFilePath);

    user.avatar = newFilename;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating avatar:", error); // Detailed error logging
    return next(new HttpError("Error updating avatar", 500));
  }
};



// Edit User Details
const editUser = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!name || !email || !currentPassword || !newPassword) {
      return next(new HttpError("Please fill in all fields", 422));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found", 403));
    }

    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== req.user.id) {
      return next(new HttpError("Email already exists", 422));
    }

    const validateUserPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validateUserPassword) {
      return next(new HttpError("Invalid current password", 422));
    }

    if (newPassword !== confirmNewPassword) {
      return next(new HttpError("New passwords do not match", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, password: hashedPassword },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user details:", error); // Debugging line
    return next(new HttpError("Error updating user details", 500));
  }
};

// Get all users or authors
const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-password");
    res.status(200).json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error); // Debugging line
    return next(new HttpError("Error fetching authors", 500));
  }
};

export { registerUser, loginUser, getUser, changeAvatar, editUser, getAuthors };
