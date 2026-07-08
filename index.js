const express = require("express");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

const db = new Database("users.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS users(
    login TEXT PRIMARY KEY,
    password TEXT,
    license_key TEXT,
    hwid TEXT,
    expire INTEGER,
    banned INTEGER DEFAULT 0
)
`).run();

app.get("/", (req, res) => {
    res.send("Launcher Auth API");
});

// Регистрация
app.post("/register", (req, res) => {
    const { login, password, key } = req.body;

    const exists = db.prepare("SELECT * FROM users WHERE login=?").get(login);

    if (exists)
        return res.json({ success: false, message: "User exists" });

    db.prepare(`
        INSERT INTO users(login,password,license_key,expire,banned)
        VALUES(?,?,?,?,0)
    `).run(
        login,
        password,
        key,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    );

    res.json({ success: true });
});

// Логин
app.post("/login", (req, res) => {

    const { login, password, hwid } = req.body;

    const user = db.prepare(
        "SELECT * FROM users WHERE login=? AND password=?"
    ).get(login, password);

    if (!user)
        return res.json({ success: false, message: "Wrong login" });

    if (user.banned)
        return res.json({ success: false, message: "Banned" });

    if (user.expire < Math.floor(Date.now() / 1000))
        return res.json({ success: false, message: "Subscription expired" });

    if (!user.hwid) {
        db.prepare("UPDATE users SET hwid=? WHERE login=?")
            .run(hwid, login);

        return res.json({ success: true, message: "HWID linked" });
    }

    if (user.hwid !== hwid)
        return res.json({ success: false, message: "HWID mismatch" });

    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server started");
});