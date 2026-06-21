import "dotenv/config";
import express from "express";
import productRoutes from "./features/products/product.routes";
import authRoutes from "./features/auth/auth.routes";
import cartRoutes from "./features/cart/cart.routes";
import orderRoutes from "./features/orders/order.routes";
import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import redis from "./lib/redis";
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.get("/", (req, res) => {
    res.json({ message: "ShopAPI is running" });
});
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
//404 - after all routes
app.use(notFound);
//error handler - always last
app.use(errorHandler);
async function start() {
    try {
        await redis.connect();
    }
    catch {
        console.warn("Redis unavailable — caching disabled");
        redis.disconnect(false);
    }
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
