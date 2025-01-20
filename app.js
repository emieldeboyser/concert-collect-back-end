const express = require("express");
const cors = require("./middleware/cors");
const setupBodyParser = require("./middleware/bodyParser");
const { connectToDatabase } = require("./config/db");
const concertsRoutes = require("./routes/concerts");
const mapRoutes = require("./routes/map");
const venuesRoutes = require("./routes/venues");
const authRoutes = require("./routes/auth");
const path = require("path");
const statRoutes = require("./routes/stats");

const app = express();

(async () => {
  await connectToDatabase(); // Ensure the database connection is established before the server starts
})();

app.set("trust proxy", true);
// Middleware
app.use(cors);
setupBodyParser(app);

// Routes
app.use("/api/concerts", concertsRoutes);
app.use("/api/venues", venuesRoutes);
app.use("", authRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/adress", mapRoutes);

// Serve uploads
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Start server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
