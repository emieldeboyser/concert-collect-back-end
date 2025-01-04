const mysql = require("mysql2/promise");

let connection;

async function connectToDatabase() {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      database: process.env.DB_NAME || "concertCollect",
      port: process.env.DB_PORT || 3306,
      password: process.env.DB_PASSWORD || "secret123",
    });
    console.log("Connected to MySQL!");
  } catch (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1); // Exit the process if connection fails
  }
}

module.exports = { connectToDatabase, getConnection: () => connection };
