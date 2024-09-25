// Assistance provided by ChatGPT in generating the web client logic for handling user authentication.
const express = require("express");
const router = express.Router();
const path = require("path");

// Serve login page
router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/login.html"));
});

// Serve static files (HTML, CSS, JS) without authentication
router.use(express.static(path.join(__dirname, "../public")));

module.exports = router;