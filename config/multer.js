const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // Import the UUID library

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  // Rename the file to include the current date

  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});

module.exports = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
