const express = require("express");
const router = express.Router();
const { getConnection } = require("../config/db");

const renderPerYear = (results) => {
  const concertsPerYear = results.reduce((acc, result) => {
    const year = new Date(result.created_at).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  return concertsPerYear;
};

// FETCH VENUES
router.get("/", async (req, res) => {
  console.log("Fetching stats...");
  try {
    const connection = getConnection(); // Get the database connection
    const [results] = await connection.query(
      "SELECT * FROM concerts order by created_at desc"
    );

    // Calculate the number of distinct venues
    const distinctVenues = new Set(results.map((result) => result.location));
    const numberOfDistinctVenues = distinctVenues.size;

    // Count the frequency of each venue
    const venueCount = results.reduce((acc, result) => {
      acc[result.location] = (acc[result.location] || 0) + 1;
      return acc;
    }, {});

    // Get the most frequent venue
    const mostFrequentVenue = Object.keys(venueCount).reduce((a, b) =>
      venueCount[a] > venueCount[b] ? a : b
    );

    // transform mostFrequentVenue into a number
    const mostFrequentVenueNumber = parseInt(mostFrequentVenue);

    const last3Concerts = results.slice(0, 3);

    // fetch name of the most popular venue

    const [venue_name] = await connection.query(
      "SELECT * FROM venues WHERE id = ?",
      [mostFrequentVenueNumber]
    );

    // get all the images for the last 3 concerts

    // Prepare the response data
    const data = {
      totalConcerts: results.length,
      most_popular_venue: venue_name[0].name,
      different_venues: numberOfDistinctVenues,
      last_concerts: last3Concerts,
      concerts_per_year: renderPerYear(results),
      favourite_concert: 3,
    };

    res.json(data);
  } catch (err) {
    console.error("Error fetching venues:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
