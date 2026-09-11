const express = require("express");
const db = require("./database");

const router = express.Router();

router.get("/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();

    res.json(products);
});

module.exports = router;