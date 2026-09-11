const express = require("express");
const db = require("./database");

const router = express.Router();

router.post("/payments/initialize", async (req, res) => {
    const {
        email
    } = req.body;

    if (!email) {
        return res.status(400).json({
            error: "Email is required."
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
        req.body.delivery === "express"
            ? 25
            : 0;

    const tax =
        (subtotal + shipping) * 0.075;

    const total =
        subtotal + shipping + tax;

    const amount =
        Math.round(total * 1400 * 100);

    try {
        const response = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    email:
                        email.trim().toLowerCase(),
                    amount: String(amount),
                    currency: "NGN"
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.status) {
            return res.status(502).json({
                error: "Unable to initialize payment."
            });
        }

        res.json({
            success: true,
            authorization_url:
                data.data.authorization_url,
            access_code:
                data.data.access_code,
            reference:
                data.data.reference
        });
    } catch (error) {
        console.error(
            "Paystack initialization error:",
            error
        );

        res.status(500).json({
            error: "Payment initialization failed."
        });
    }
});

router.get("/payments/verify/:reference", async (req, res) => {
    const {
        reference
    } = req.params;

    if (!reference) {
        return res.status(400).json({
            error: "Payment reference is required."
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
        req.query.delivery === "express"
            ? 25
            : 0;

    const tax =
        (subtotal + shipping) * 0.075;

    const total =
        subtotal + shipping + tax;

    const expectedAmount =
        Math.round(total * 1400 * 100);

    try {
        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.status) {
            return res.status(502).json({
                error: "Unable to verify payment."
            });
        }

        const transaction =
            data.data;

        if (transaction.status !== "success") {
            return res.status(400).json({
                error: "Payment was not successful."
            });
        }

        if (transaction.currency !== "NGN") {
            return res.status(400).json({
                error: "Payment currency does not match the order."
            });
        }

        if (transaction.amount !== expectedAmount) {
            return res.status(400).json({
                error: "Payment amount does not match the order."
            });
        }

        res.json({
            success: true,
            reference:
                transaction.reference,
            status:
                transaction.status,
            amount:
                transaction.amount,
            currency:
                transaction.currency
        });
    } catch (error) {
        console.error(
            "Paystack verification error:",
            error
        );

        res.status(500).json({
            error: "Payment verification failed."
        });
    }
});

module.exports = router;