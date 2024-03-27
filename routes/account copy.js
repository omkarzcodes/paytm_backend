const express = require("express");
const { Account } = require("../db");
const { default: mongoose } = require("mongoose");
const authMiddleware3 = require("../middleware");

const router = express.Router();

router.get("/balance", authMiddleware3, async (req, res) => {
  const account = await Account.findOne({
    userId: req.userId,
  });

  res.json({
    balance: account.balance,
  });
});

async function transfer(req) {
  const session = await mongoose.startSession();

  session.startTransaction();

  const { to, amount } = req.body;

  const account = Account.findOne({ userId: req.userId }).session(session);

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    // return res.status(400).json({ msg: "Insufficient Balance" });
    console.log("Insufficient Balance");
  }

  const toAccount = Account.find({ userId: to }).session(session);

  if (!toAccount) {
    console.log("Invalid Account");
  }

  await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  ).session(session);

  await Account.updateOne({ userId: to }, { inc: { balance: amount } }).session(
    session
  );

  await session.commitTransaction();
  console.log("done");
}

transfer({
  userId: "65e6ae1a1bcd725495866374",
  body: {
    to: "65e6b42ae28c20867be9e5d4",
    amount: 100,
  },
});

transfer({
  userId: "65e6ae1a1bcd725495866374",
  body: {
    to: "65e6b42ae28c20867be9e5d4",
    amount: 100,
  },
});

module.exports = router;
