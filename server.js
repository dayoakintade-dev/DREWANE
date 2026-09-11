require("dotenv").config();

const express = require("express");
const db = require("./database");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const accountRoutes = require("./accountRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
    res.json({ status: "DREWANE is running" });
});

app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", accountRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentRoutes);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`DREWANE running at http://localhost:${PORT}`);
});