import "dotenv/config";
import express from "express";
import productRoutes from "./features/products/product.routes";
import authRoutes from "./features/auth/auth.routes";
import cartRoutes from "./features/cart/cart.routes";
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.get("/", (req, res) => {
    res.json({ message: "ShopAPI is running" });
});
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
