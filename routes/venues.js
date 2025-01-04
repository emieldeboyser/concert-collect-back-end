const express = require("express");
const { connection } = require("../config/db");
const router = express.Router();
const { getConnection } = require("../config/db");

// FETCH VENUES
router.get("/", async (req, res) => {
  try {
    const connection = getConnection(); // Get the database connection
    const [results] = await connection.query("SELECT * FROM venues");
    res.json(results);
  } catch (err) {
    console.error("Error fetching venues:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// FETCH VENUE
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Fetching concert with id:", id);

  try {
    const connection = getConnection(); // Get the database connection
    const [results] = await connection.query(
      `SELECT 
            c.id, 
            c.price, 
            c.artist, 
            v.name AS venue_name, 
            v.country, 
            c.created_at AS date, 
            c.image_path,
            v.location AS city,
            v.latitude,
            v.longitude,
            c.rating,
            c.spotify_link
        FROM 
            concerts c
        INNER JOIN 
            venues v
        ON 
            c.location = v.id
        WHERE c.id = ?`,
      [id]
    );
    res.json(results[0]);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE VENUE
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Deleting venue with id:", id);

  try {
    const connection = getConnection(); // Get the database connection
    await connection.query("DELETE FROM venues WHERE id = ?", [id]);
    console.log("Venue deleted successfully");
    res.json({ message: "Venue deleted successfully" });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST VENUE
router.post("/add", async (req, res) => {
  const { name, country, city } = req.body;

  console.log("Request body:", req.body);

  if (!name || !country) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }

  try {
    const connection = getConnection(); // Get the database connection
    await connection.query(
      "INSERT INTO venues (name, country, location) VALUES (?, ?, ?)",
      [name, country, city]
    );
    console.log("Venue added successfully");
    res.json({ message: "Venue added successfully" });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
