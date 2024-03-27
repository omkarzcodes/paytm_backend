const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const authMiddleware3 = require("../middleware");

const router = express.Router();

const signupBody = zod.object({
  username: zod.string(),
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});

router.post("/signup", async (req, res) => {
  const { success } = signupBody.safeParse(req.body);
  const { username, password, firstName, lastName } = req.body;

  // Check whether the inputs are correct using zod validations
  if (!success) {
    return res.status(411).json({ msg: "Invalid Inputs" });
  }

  //Checking whether the user already exists

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(411).json({ msg: "User Already Exists" });
  }

  const user = await User.create({
    username,
    password,
    firstName,
    lastName,
  });

  const userId = user._id;

  const jwtToken = jwt.sign({ userId }, JWT_SECRET);

  await Account.create({
    userId,
    balance: 1 + Math.random() * 10000,
  });

  res.json({ msg: "User Created Successfully", token: jwtToken });
});

const signinBody = zod.object({
  username: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

router.post("/signin", async (req, res) => {
  const { success } = signinBody.safeParse(req.body);
  const { username, password } = req.body;

  if (!success) {
    return res.status(411).json({ msg: "Invalid Inputs" });
  }

  const user = await User.findOne({
    username,
    password,
  });

  if (!user) {
    return res.status(401).json({ msg: "Invalid Username or Password" });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);

  res.json({ msg: "User Logged In Successfully", token });
});

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

router.put("/", authMiddleware3, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);

  if (!success) {
    return res.status(411).json({ msg: "Error While Updating" });
  }

  const user = User.find({ username: req.body.username });

  if (user) {
    return res.json({
      msg: "Username Already Exists , Try Unique Username",
    });
  }

  await User.updateOne({ _id: req.userId }, req.body);

  res.json({ msg: "Updated Successfully" });
});

router.get("/bulk", async (req, res) => {
  const { filter } = req.query || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      _id: user._id,
      username: user.username,
      firstname: user.firstName,
      lastName: user.lastName,
    })),
  });
});

module.exports = router;
