const express = require("express");
const crypto = require("crypto");
const db = require("./database");

const router = express.Router();

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
    const [salt, storedHash] =
        storedPassword.split(":");

    if (!salt || !storedHash) {
        return false;
    }

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(storedHash, "hex")
    );
}

router.post("/account/register", (req, res) => {
    const {
        name,
        email,
        phone,
        password
    } = req.body;

    if (
        !name ||
        !email ||
        !phone ||
        !password
    ) {
        return res.status(400).json({
            error: "All account fields are required."
        });
    }

    const normalizedEmail =
        email.trim().toLowerCase();

    const existingUser = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ?
    `).get(normalizedEmail);

    if (existingUser) {
        return res.status(409).json({
            error: "An account with this email already exists."
        });
    }

    const passwordHash =
        hashPassword(password);

    const result = db.prepare(`
        INSERT INTO users (
            name,
            email,
            phone,
            password
        )
        VALUES (?, ?, ?, ?)
    `).run(
        name.trim(),
        normalizedEmail,
        phone.trim(),
        passwordHash
    );

    const user = db.prepare(`
        SELECT
            id,
            name,
            email,
            phone
        FROM users
        WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
        success: true,
        user
    });
});

router.post("/account/login", (req, res) => {
    const {
        email,
        password
    } = req.body;

    if (
        !email ||
        !password
    ) {
        return res.status(400).json({
            error: "Email and password are required."
        });
    }

    const normalizedEmail =
        email.trim().toLowerCase();

    const user = db.prepare(`
        SELECT
            id,
            name,
            email,
            phone,
            password
        FROM users
        WHERE email = ?
    `).get(normalizedEmail);

    if (!user) {
        return res.status(401).json({
            error: "The email address or password is incorrect."
        });
    }

    if (
        !verifyPassword(
            password,
            user.password
        )
    ) {
        return res.status(401).json({
            error: "The email address or password is incorrect."
        });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone
        }
    });
});

router.get("/account/:id", (req, res) => {
    const user = db.prepare(`
        SELECT
            id,
            name,
            email,
            phone
        FROM users
        WHERE id = ?
    `).get(req.params.id);

    if (!user) {
        return res.status(404).json({
            error: "Account not found."
        });
    }

    res.json({
        user
    });
});

router.patch("/account/:id", (req, res) => {
    const {
        name,
        email,
        phone
    } = req.body;

    if (
        !name ||
        !email ||
        !phone
    ) {
        return res.status(400).json({
            error: "Name, email, and phone are required."
        });
    }

    const user = db.prepare(`
        SELECT id
        FROM users
        WHERE id = ?
    `).get(req.params.id);

    if (!user) {
        return res.status(404).json({
            error: "Account not found."
        });
    }

    const normalizedEmail =
        email.trim().toLowerCase();

    const emailOwner = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ?
        AND id != ?
    `).get(
        normalizedEmail,
        req.params.id
    );

    if (emailOwner) {
        return res.status(409).json({
            error: "An account with this email already exists."
        });
    }

    db.prepare(`
        UPDATE users
        SET
            name = ?,
            email = ?,
            phone = ?
        WHERE id = ?
    `).run(
        name.trim(),
        normalizedEmail,
        phone.trim(),
        req.params.id
    );

    const updatedUser = db.prepare(`
        SELECT
            id,
            name,
            email,
            phone
        FROM users
        WHERE id = ?
    `).get(req.params.id);

    res.json({
        success: true,
        user: updatedUser
    });
});

module.exports = router;