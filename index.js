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

app.post("/register", (req, res) => {

    const { login, password, key } = req.body;

    if (!login || !password)
        return res.json({ success: false, error: "Missing fields" });

    const exists = db.prepare("SELECT * FROM users WHERE login=?").get(login);

    if (exists)
        return res.json({ success: false, error: "User exists" });

    db.prepare(`
        INSERT INTO users(login,password,license_key,expire,banned)
        VALUES(?,?,?,?,0)
    `).run(
        login,
        password,
        key || "",
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    );

    res.json({ success: true });

});

app.post("/login", (req, res) => {

    const { login, pass } = req.body;

    const user = db.prepare(
        "SELECT * FROM users WHERE login=? AND password=?"
    ).get(login, pass);

    if (!user)
        return res.json({
            success: false,
            error: "Неверный логин или пароль"
        });

    res.json({
        success: true,
        user: {
            login: user.login,
            id: 1,
            role: "Premium",
            subscription: "9999-12-31 23:59:59",
            hwid: ""
        }
    });

});

app.post("/create-user", (req, res) => {

    const { login, password, license_key, days } = req.body;

    if (!login || !password)
        return res.json({ success: false });

    const expire =
        Math.floor(Date.now() / 1000) + (days || 30) * 86400;

    try {

        db.prepare(`
            INSERT INTO users
            (login,password,license_key,hwid,expire,banned)
            VALUES (?,?,?,?,?,0)
        `).run(
            login,
            password,
            license_key || "",
            "",
            expire
        );

        res.json({ success: true });

    } catch {

        res.json({
            success: false,
            error: "User exists"
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server started");
});