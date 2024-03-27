const mongoose = require("mongoose");

mongoose
  .connect("mongodb+srv://demo:Blibli09@cluster0.gkx6w.mongodb.net/paytmApp")
  .then(() => console.log("Mongoose Connected!!!"));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowerCase: true,
    minLength: 3,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
});

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: "Number",
    required: true,
  },
});

const User = mongoose.model("Users", userSchema);
const Account = mongoose.model("Account", accountSchema);

// module.exports = User;

module.exports = { User, Account };
