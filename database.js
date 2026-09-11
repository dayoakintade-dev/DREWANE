const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "drewane.db");

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        size TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL UNIQUE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        address TEXT NOT NULL,
        apartment TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        delivery TEXT NOT NULL,
        subtotal REAL NOT NULL,
        shipping REAL NOT NULL,
        total REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        size TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
`);

const insertProduct = db.prepare(`
    INSERT INTO products (name, price, category, image)
    VALUES (?, ?, ?, ?)
`);

const products = [
    ["Aurelia Ring", 420, "rings", "product-01.webp"],
    ["Solis Necklace", 680, "necklaces", "product-02.webp"],
    ["Forma Earrings", 390, "earrings", "product-03.webp"],
    ["No. 02 Bracelet", 520, "bracelets", "product-04.webp"],
    ["Sculpt Ring", 460, "rings", "product-05.webp"],
    ["Arc Necklace", 720, "necklaces", "product-06.webp"],
    ["Contour Earrings", 380, "earrings", "product-07.webp"],
    ["No. 01 Bracelet", 540, "bracelets", "product-08.webp"],
    ["No. 01 Eau de Parfum", 180, "fragrance", "product-09.webp"],
    ["No. 02 Eau de Parfum", 195, "fragrance", "product-10.webp"]
];

const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get();

if (productCount.count === 0) {
    const insertProducts = db.transaction(() => {
        for (const product of products) {
            insertProduct.run(...product);
        }
    });

    insertProducts();
}

module.exports = db;