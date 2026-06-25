const mysql = require("mysql2");
const fs = require("fs");
const express = require("express");
const path = require("path");
const session = require("express-session");
const multer = require("multer");

const app = express();
const PORT = 3000;
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "shidratul",
  database: "canvas_soul"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed");
    console.log(err);
    return;
  }

  console.log("MySQL Connected");
});

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "canvassoulsecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  db.query("SELECT * FROM photos ORDER BY id DESC", (err, results) => {
    if (err) {
      return res.send("Database Error");
    }

    res.render("index", { photos: results });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "nisa" && password === "nisa13") {
    req.session.admin = true;
    return res.redirect("/admin");
  }

  res.send("Invalid Username or Password");
});
app.get("/admin", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/login");
  }

  db.query("SELECT * FROM photos ORDER BY id DESC", (err, results) => {
    if (err) {
      return res.send("Database Error");
    }

    res.render("admin", { photos: results });
  });
});
app.post("/upload", upload.single("photo"), (req, res) => {
  const title = req.body.title;
  const photo_code = req.body.photo_code;
  const price = req.body.price;
  const image = req.file.filename;

  const sql =
    "INSERT INTO photos (title, photo_code, price, image) VALUES (?, ?, ?, ?)";

  db.query(sql, [title, photo_code, price, image], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database Error");
    }

    console.log("Photo saved to database");
    res.redirect("/admin");
  });
});
app.post("/delete/:id", (req, res) => {
const id = req.params.id;

db.query("SELECT * FROM photos WHERE id = ?", [id], (err, result) => {
if (err) return res.send("Database Error");


if (result.length === 0) {
  return res.send("Photo Not Found");
}

const imageName = result[0].image;

const imagePath = path.join(
  __dirname,
  "public",
  "uploads",
  imageName
);

if (fs.existsSync(imagePath)) {
  fs.unlinkSync(imagePath);
}

db.query("DELETE FROM photos WHERE id = ?", [id], (err) => {
  if (err) return res.send("Delete Error");

  res.redirect("/admin");
});


});
});
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/test", (req, res) => {
  res.send("TEST WORKING");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});