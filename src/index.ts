import "dotenv/config";
import express from "express";
import { Request, Response, NextFunction } from "express";
import productRoutes from "./features/products/product.routes";
import authRoutes from "./features/auth/auth.routes";
import cartRoutes from "./features/cart/cart.routes";
import orderRoutes from "./features/orders/order.routes";
import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
