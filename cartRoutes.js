const express = require("express");
const db = require("./database");

const router = express.Router();

router.get("/cart", (req, res) => {
    const cart = db.prepare(`
        SELECT
            cart_items.id,
            cart_items.product_id,
            products.name,
            products.price,
            products.image,
            products.category,
            cart_items.quantity,
            cart_items.size
        FROM cart_items
        INNER JOIN products
            ON cart_items.product_id = products.id
    `).all();

    res.json(cart);
});

router.post("/cart", (req, res) => {
    const {
        product_id,
        quantity = 1,
        size = null
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

    if (
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        return res.status(400).json({
            error: "Quantity must be at least 1."
        });
    }

    const existing = db.prepare(`
        SELECT *
        FROM cart_items
        WHERE product_id = ?
        AND (
            size = ?
            OR (size IS NULL AND ? IS NULL)
        )
    `).get(
        product_id,
        size,
        size
    );

    if (existing) {
        db.prepare(`
            UPDATE cart_items
            SET quantity = quantity + ?
            WHERE id = ?
        `).run(
            quantity,
            existing.id
        );
    } else {
        db.prepare(`
            INSERT INTO cart_items (
                product_id,
                quantity,
                size
            )
            VALUES (?, ?, ?)
        `).run(
            product_id,
            quantity,
            size
        );
    }

    res.status(201).json({
        success: true
    });
});

router.patch("/cart/:id", (req, res) => {
    const {
        quantity
    } = req.body;

    if (
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        return res.status(400).json({
            error: "Quantity must be at least 1."
        });
    }

    const result = db.prepare(`
        UPDATE cart_items
        SET quantity = ?
        WHERE id = ?
    `).run(
        quantity,
        req.params.id
    );

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Cart item not found."
        });
    }

    res.json({
        success: true
    });
});

router.delete("/cart/:id", (req, res) => {
    const result = db.prepare(`
        DELETE FROM cart_items
        WHERE id = ?
    `).run(
        req.params.id
    );

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Cart item not found."
        });
    }

    res.json({
        success: true
    });
});

router.delete("/cart", (req, res) => {
    db.prepare(`
        DELETE FROM cart_items
    `).run();

    res.json({
        success: true
    });
});

module.exports = router;