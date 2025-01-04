const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,DELETE",
};

module.exports = cors(corsOptions); // Correctly export the middleware
