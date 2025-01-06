const express = require("express");
const { getConnection } = require("../config/db");
const upload = require("../config/multer");
const router = express.Router();

// FETCH CONCERTS
router.post("/", async (req, res) => {
  try {
    const connection = getConnection(); // Get the database connection
    const { sortBy = "date", order = "DESC", search = "" } = req.query;
    const validColumns = {
      date: "c.created_at",
      cost: "c.price",
      artist: "c.artist",
      location: "v.name",
    };

    // Validate the sortBy and order parameters
    const sortColumn = validColumns[sortBy] || "c.created_at";
    const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Build the SQL query with filtering
    const [results] = await connection.query(
      `
      SELECT c.id, c.price, c.artist, v.name AS venue_name, v.country, c.created_at AS date, c.image_path
      FROM concerts c
      INNER JOIN venues v ON c.location = v.id
      WHERE c.artist LIKE ? -- Filter by artist name
      ORDER BY ${sortColumn} ${sortOrder};
      `,
      [`%${search}%`] // Use parameterized query to prevent SQL injection
    );

    // Format the price field
    results.forEach((concert) => {
      if (parseFloat(concert.price) === 0.0) {
        concert.price = "Free";
      } else {
        concert.price = `€${parseFloat(concert.price).toFixed(2)}`;
      }
    });

    res.json(results);
  } catch (err) {
    console.error("Error fetching concerts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// FETCH CONCERT
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = getConnection();
    const [results] = await connection.query(
      `
      SELECT 
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

// POST CONCERT
router.post("/add", upload.single("image"), async (req, res) => {
  const { artist, cost, location, date, rating } = req.body;
  console.log("Request body:", req.body.spotify_id);
  const image = req.file;

  const spotify_id = "123";

  if (!artist || !cost || !location || !date || !spotify_id) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }

  try {
    const connection = getConnection();
    await connection.query(
      "INSERT INTO concerts (artist, price, location, created_at, image_path, spotify_link, rating) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        artist,
        cost,
        location,
        date,
        image ? image.path : null,
        spotify_id,
        rating,
      ] // Save the path if an image is uploaded
    );
    console.log("Concert added successfully");
    res.json({ message: "Concert added successfully" });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE CONCERT
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Deleting concert with id:", id);

  try {
    const connection = getConnection();
    await connection.query("DELETE FROM concerts WHERE id = ?", [id]);
    console.log("Concert deleted successfully");
    res.json({ message: "Concert deleted successfully" });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
