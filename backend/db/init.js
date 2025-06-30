const db = require("./index");
const util = require("util");

const query = util.promisify(db.query).bind(db);

const initDB = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ 'users' table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating 'users' table:", err);
  } finally {
    db.end(); // Close the connection
  }
};

initDB();