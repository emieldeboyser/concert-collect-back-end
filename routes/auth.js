const express = require("express");
const axios = require("axios");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getConnection } = require("../config/db");
require("dotenv").config();

const JWT_SECRET = "your_jwt_secret_key";
const REFRESH_SECRET = "your_refresh_secret_key"; // Another secret for refresh token

// Set token expiration times
const JWT_EXPIRATION = "1h"; // JWT expiration time (1 hour)
const REFRESH_EXPIRATION = "7d"; // Refresh token expiration time (7 days)

// FETCH SPOTIFY TOKEN
router.post("/api/getAccessToken", async (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Client ID and secret not set" });
  }

  // Base64 encode the client credentials
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
      }
    );

    // Send the access token to the frontend
    res.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    });
  } catch (error) {
    console.error("Error fetching access token:", error);
    res.status(500).json({ error: "Failed to fetch access token" });
  }
});

// user login
router.post("/api/login", async (req, res) => {
  console.log("Logging in...");
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const connection = getConnection(); // Get the database connection

    // Fetch user from the database
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.hashed_password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRATION }
    );

    // Log login activity
    const clientIp = getClientIp(req);

    await logLoginActivity(connection, user, clientIp, true);

    // Send tokens in response
    return res.status(200).json({
      message: "Logged in successfully",
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error("Error logging in:", error);

    const clientIp = getClientIp(req);

    if (username) {
      const [rows] = await getConnection().query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      if (rows.length > 0) {
        await logLoginActivity(getConnection(), rows[0], clientIp, false);
      }
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to extract client IP
const getClientIp = (req) => {
  let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.substring(7); // Remove "::ffff:"
  }
  return clientIp;
};

// Helper function to log login activity
const logLoginActivity = async (connection, user, ipAddress, successful) => {
  await connection.query(
    "INSERT INTO login_activity (user_id, email, ip_address, successful) VALUES (?, ?, ?, ?)",
    [user.id, user.email, ipAddress, successful]
  );
};

router.post("/api/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ error: "Refresh token is required" });
  }

  try {
    // Verify the refresh token
    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ error: "Invalid or expired refresh token" });
      }

      // Generate a new access token
      const accessToken = jwt.sign(
        {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await getConnection().query(
    "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
    [username, email, hashedPassword]
  );
  const accessToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
  res.json({ accessToken });
});

module.exports = router;
