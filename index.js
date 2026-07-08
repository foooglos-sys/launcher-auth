const express = require("express");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

const db = new Database("users.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS users(
    login TEXT PRIMARY KEY,
    password TEXT,
    hwid TEXT,
    expiry INTEGER,
    banned INTEGER DEFAULT 0
)
`).run();

app.get("/", (req, res) => {
    res.send("Launcher Auth API");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});