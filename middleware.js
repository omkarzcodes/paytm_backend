const { JWT_SECRET } = require("./config");
const { User } = require("./db");
const jwt = require("jsonwebtoken");

const authMiddleware1 = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ msg: "Authorization Token is Not Provided" });
  }

  const jwtToken = authorization.split(" ");

  if (jwtToken.length !== 2 || jwtToken[0] !== "Bearer") {
    return res.status(401).json({ msg: "Authorization Token is Invalid" });
  }

  const token = jwtToken[1];

  //Checking whether the password for the existing user is correct via jwt

  //splitting the string of token and getting the string after the space ("Bearer jwtToken")

  const isValidToken = jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ msg: "Username or Password is Invalid" });
    }

    const { username } = decoded;

    const foundUser = await User.findOne({ username });

    if (!foundUser) {
      return res.status(404).json({ msg: "User not found" });
    }
  });
  next();
};

const authMiddleware3 = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(403).json({ msg: "Invalid AuthToken" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(403).json({ Autherror: err });
  }
};

// this is the version given by gpt which is great

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;

  try {
    if (!authorization) {
      return res
        .status(401)
        .json({ msg: "Authorization Token is Not Provided" });
    }

    const jwtToken = authorization.split(" ");

    if (jwtToken.length !== 2 || jwtToken[0] !== "Bearer") {
      return res.status(401).json({ msg: "Authorization Token is Invalid" });
    }

    const token = jwtToken[1];

    const decoded = await jwt.verify(token, JWT_SECRET);

    const { username } = decoded;

    const foundUser = await User.findOne({ username });

    if (!foundUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Attach user information to the request or perform additional actions if needed
    req.user = foundUser;

    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

module.exports = authMiddleware3;
