import "dotenv/config";
import express from "express";
import { Request, Response, NextFunction } from "express";
import productRoutes from "./features/products/product.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "ShopAPI is running" });
});

app.use("/products", productRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
