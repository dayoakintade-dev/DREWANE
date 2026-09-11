const express = require("express");
const db = require("./database");

const router = express.Router();

router.post("/orders", (req, res) => {
    const {
        email,
        phone,
        first_name,
        last_name,
        address,
        apartment = null,
        city,
        state,
        postal_code,
        country,
        delivery
    } = req.body;

    if (
        !email ||
        !phone ||
        !first_name ||
        !last_name ||
        !address ||
        !city ||
        !state ||
        !postal_code ||
        !country ||
        !delivery
    ) {
        return res.status(400).json({
            error: "All required checkout fields are required."
        });
    }

    if (
        delivery !== "standard" &&
        delivery !== "express"
    ) {
        return res.status(400).json({
            error: "Invalid delivery option."
        });
    }

    const cartItems = db.prepare(`
        SELECT
            cart_items.product_id,
            products.name,
            products.price,
            cart_items.quantity,
            cart_items.size
        FROM cart_items
        INNER JOIN products
            ON cart_items.product_id = products.id
    `).all();

    if (!cartItems.length) {
        return res.status(400).json({
            error: "Your cart is empty."
        });
    }

    const subtotal = cartItems.reduce(
        (total, item) => {
            return total + (
                item.price * item.quantity
            );
        },
        0
    );

    const shipping =
        delivery === "express"
            ? 25
            : 0;

    const total =
        subtotal + shipping;

    const createOrder = db.transaction(() => {
        const orderResult = db.prepare(`
            INSERT INTO orders (
                email,
                phone,
                first_name,
                last_name,
                address,
                apartment,
                city,
                state,
                postal_code,
                country,
                delivery,
                subtotal,
                shipping,
                total,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            email.trim().toLowerCase(),
            phone.trim(),
            first_name.trim(),
            last_name.trim(),
            address.trim(),
            apartment
                ? apartment.trim()
                : null,
            city.trim(),
            state.trim(),
            postal_code.trim(),
            country.trim(),
            delivery,
            subtotal,
            shipping,
            total,
            new Date().toISOString()
        );

        const orderId =
            orderResult.lastInsertRowid;

        const insertOrderItem = db.prepare(`
            INSERT INTO order_items (
                order_id,
                product_id,
                name,
                price,
                quantity,
                size
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of cartItems) {
            insertOrderItem.run(
                orderId,
                item.product_id,
                item.name,
                item.price,
                item.quantity,
                item.size
            );
        }

        return orderId;
    });

    const orderId = createOrder();

    res.status(201).json({
        success: true,
        orderId
    });
});

module.exports = router;