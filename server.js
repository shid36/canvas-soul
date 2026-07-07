const mysql = require("mysql2");
const fs = require("fs");
const express = require("express");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
require("dotenv").config();

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 3000;
const db = mysql.createConnection(process.env.DATABASE_URL);

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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "canvas-soul",
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  db.query("SELECT * FROM photos ORDER BY id DESC", (err, results) => {
    if (err) {
      console.log("HOME PAGE ERROR:", err);
      return res.send(err.message);
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
  try {
    console.log(req.file);

    const title = req.body.title;
    const photo_code = req.body.photo_code;
    const price = req.body.price;
    const image = req.file.path;
    console.log(req.file);
console.log(req.file.path);

    const sql =
      "INSERT INTO photos (title, photo_code, price, image) VALUES (?, ?, ?, ?)";

    db.query(sql, [title, photo_code, price, image], (err) => {
      if (err) {
        console.log(err);
        return res.send("Database Error");
      }

      res.redirect("/admin");
    });
  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).send(err.message);
  }
});
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM photos WHERE id = ?", [id], (err) => {
    if (err) {
      return res.send("Delete Error");
    }

    res.redirect("/admin");
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