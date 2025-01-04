const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

// FETCH SPOTIFY TOKEN
router.post("/api/getAccessToken", async (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  console.log("Client ID:", clientId);
  console.log("Client secret:", clientSecret);

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

module.exports = router;
