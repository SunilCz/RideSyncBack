const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const refreshAccessToken = async (refreshToken) => {
  // Assuming you have a model for RefreshToken
  const RefreshToken = require("../models/refreshTokenModel");

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if the refresh token is still valid
    const refreshTokenDocument = await RefreshToken.findOne({
      userId: decoded.userId,
      token: refreshToken,
    });

    if (!refreshTokenDocument) {
      throw new Error("Invalid refresh token");
    }

    // Implement logic to generate a new access token here
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Set the expiration time as needed
    );

    // Return the new access token
    return newAccessToken;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken; // Assuming you have a refresh token

    if (!token && !refreshToken) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    try {
      // Verify token
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      // Get user id from token
      const user = await User.findById(verified.id).select("-password");

      // Check if the cookie has expired
      const isTokenExpired = verified.exp < Date.now() / 1000;
      if (isTokenExpired && refreshToken) {
        // Refresh the access token
        const newToken = await refreshAccessToken(refreshToken);

        // Send the new token in the response
        res.cookie("token", newToken, {
          path: "/",
          httpOnly: true,
          expires: new Date(Date.now() + 1000 * 86400), // 1 day
          sameSite: "none",
          secure: true,
        });

        // Continue with the rest of the code
        // Verify token
        const verified = jwt.verify(newToken, process.env.JWT_SECRET);
        // Get user id from token
        const user = await User.findById(verified.id).select("-password");

        if (!user) {
          res.status(404);
          throw new Error("User not found");
        }
        if (user.role === "suspended") {
          res.status(400);
          throw new Error("User suspended, please contact support");
        }

        req.user = user;
        return next();
      }
      // Continue with the rest of the code
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }
      if (user.role === "suspended") {
        res.status(400);
        throw new Error("User suspended, please contact support");
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

const verifiedOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isVerified) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized, account not verified");
  }
});

const authorOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role === "author" || req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an author");
  }
});

const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
});

module.exports = {
  protect,
  verifiedOnly,
  authorOnly,
  adminOnly,
}