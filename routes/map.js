const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

// FETCH SPOTIFY TOKEN
router.post("/api/map", async (req, res) => {
  const { adress } = req.body;

  try {
    const response = await axios.get(
      `https://geocode.maps.co/search?q=${adress}&api_key=${process.env.MAP_TOKEN}`
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
