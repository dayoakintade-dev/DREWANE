const express = require("express");
const db = require("./database");

const router = express.Router();

router.get("/wishlist", (req, res) => {
    const wishlist = db.prepare(`
        SELECT
            wishlist_items.id,
            wishlist_items.product_id,
            products.name,
            products.price,
            products.image,
            products.category
        FROM wishlist_items
        INNER JOIN products
            ON wishlist_items.product_id = products.id
    `).all();

    res.json(wishlist);
});

router.post("/wishlist", (req, res) => {
    const {
        product_id
    } = req.body;

    const product = db.prepare(`
        SELECT *
        FROM products
        WHERE id = ?
    `).get(product_id);

    if (!product) {
        return res.status(404).json({
            error: "Product not found."
        });
    }

    const existing = db.prepare(`
        SELECT *
        FROM wishlist_items
        WHERE product_id = ?
    `).get(product_id);

    if (existing) {
        return res.status(200).json({
            success: true
        });
    }

    db.prepare(`
        INSERT INTO wishlist_items (
            product_id
        )
        VALUES (?)
    `).run(product_id);

    res.status(201).json({
        success: true
    });
});

router.delete("/wishlist/:product_id", (req, res) => {
    const result = db.prepare(`
        DELETE FROM wishlist_items
        WHERE product_id = ?
    `).run(
        req.params.product_id
    );

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Wishlist item not found."
        });
    }

    res.json({
        success: true
    });
});

router.delete("/wishlist", (req, res) => {
    db.prepare(`
        DELETE FROM wishlist_items
    `).run();

    res.json({
        success: true
    });
});

module.exports = router;