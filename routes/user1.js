// This is the code for the backend of a simple user authentication system using Express, MongoDB, Zod, and JWT

// Import the required modules
const express = require("express");
const mongoose = require("mongoose");
const zod = require("zod");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Define the constants
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/auth";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Create the Express app
const app = express();

// Use JSON middleware
app.use(express.json());

// Connect to the MongoDB database
mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Define the user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
});

// Add a pre-save hook to hash the password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  // Generate a salt
  const salt = await bcrypt.genSalt(10);

  // Hash the password using the salt
  this.password = await bcrypt.hash(this.password, salt);

  // Proceed to the next middleware
  next();
});

// Add a method to compare the password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Compare the candidate password with the hashed password
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create the user model
const User = mongoose.model("User", userSchema);

// Define the signup body schema using zod
const signupBody = zod.object({
  username: zod.string().min(3).max(20),
  password: zod.string().min(6).max(50),
  firstName: zod.string().min(1).max(20),
  lastName: zod.string().min(1).max(20),
});

// Define the signup route
app.post("/signup", async (req, res) => {
  try {
    // Validate the request body using zod
    const { username, password, firstName, lastName } = signupBody.parse(
      req.body
    );

    // Check if the user already exists
    const existingUser = await User.findOne({ username });

    // If the user exists, send a 409 conflict error
    if (existingUser) {
      return res.status(409).json({ msg: "User already exists" });
    }

    // Create a new user
    const user = await User.create({ username, password, firstName, lastName });

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    // Send a 201 created response with the token
    res.status(201).json({ msg: "User created successfully", token });
  } catch (error) {
    // If there is an error, send a 400 bad request error
    res.status(400).json({ msg: error.message });
  }
});

// Define the signin body schema using zod
const signinBody = zod.object({
  username: zod.string(),
  password: zod.string(),
});

// Define the signin route
app.post("/signin", async (req, res) => {
  try {
    // Validate the request body using zod
    const { username, password } = signinBody.parse(req.body);

    // Find the user by username
    const user = await User.findOne({ username });

    // If the user is not found, send a 401 unauthorized error
    if (!user) {
      return res.status(401).json({ msg: "Invalid username or password" });
    }

    // Compare the password
    const isMatch = await user.comparePassword(password);

    // If the password does not match, send a 401 unauthorized error
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid username or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    // Send a 200 ok response with the token
    res.status(200).json({ msg: "User logged in successfully", token });
  } catch (error) {
    // If there is an error, send a 400 bad request error
    res.status(400).json({ msg: error.message });
  }
});

// Define a middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.authorization;

    // If the header is not present, send a 401 unauthorized error
    if (!authHeader) {
      return res.status(401).json({ msg: "No token provided" });
    }

    // Extract the token from the header
    const token = authHeader.split(" ")[1];

    // Verify the token using the secret
    const payload = jwt.verify(token, JWT_SECRET);

    // Attach the user id to the request object
    req.userId = payload.userId;

    // Proceed to the next middleware
    next();
  } catch (error) {
    // If there is an error, send a 401 unauthorized error
    res.status(401).json({ msg: "Invalid token" });
  }
};

// Define a route to get the user profile
app.get("/profile", verifyToken, async (req, res) => {
  try {
    // Find the user by id
    const user = await User.findById(req.userId);

    // If the user is not found, send a 404 not found error
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Send a 200 ok response with the user data
    res.status(200).json({ msg: "User profile", user });
  } catch (error) {
    // If there is an error, send a 500 internal server error
    res.status(500).json({ msg: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
