const express = require("express");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

const db = new Database("users.db");

// База
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

// Главная
app.get("/", (req, res) => {
    res.send("Launcher Auth API");
});

// Регистрация
app.post("/register", (req, res) => {
    const { login, password, license_key } = req.body;

    if (!login || !password || !license_key)
        return res.json({ success: false, message: "Missing fields" });

    const exists = db.prepare("SELECT * FROM users WHERE login=?").get(login);

    if (exists)
        return res.json({ success: false, message: "Login exists" });

    db.prepare(`
        INSERT INTO users(login,password,license_key,expire,banned)
        VALUES(?,?,?,?,0)
    `).run(
        login,
        password,
        license_key,
        Math.floor(Date.now()/1000) + 30*24*60*60 // 30 дней
    );

    res.json({ success: true });
});

// Логин
app.post("/login", (req, res) => {

    const { login, password, hwid } = req.body;

    const user = db.prepare(
        "SELECT * FROM users WHERE login=? AND password=?"
    ).get(login,password);

    if (!user)
        return res.json({ success:false, message:"Wrong login/password" });

    if (user.banned)
        return res.json({ success:false, message:"Banned" });

    if (user.expire < Math.floor(Date.now()/1000))
        return res.json({ success:false, message:"Subscription expired" });

    // первая привязка HWID
    if (!user.hwid || user.hwid === "") {
        db.prepare("UPDATE users SET hwid=? WHERE login=?")
            .run(hwid, login);

        return res.json({
            success:true,
            message:"HWID linked"
        });
    }

    // проверка HWID
    if (user.hwid !== hwid)
        return res.json({
            success:false,
            message:"Wrong HWID"
        });

    res.json({
        success:true,
        message:"Login successful"
    });

});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});