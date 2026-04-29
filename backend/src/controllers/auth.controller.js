const User = require("../models/user.model");
const generateToken = require("../utils/generateToken");

const buildAuthResponse = (user) => ({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
  },
  token: generateToken(user._id),
});

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      const error = new Error("Name, email, and password are required");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists with this email");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: buildAuthResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: buildAuthResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
