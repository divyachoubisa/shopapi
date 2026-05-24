import { Router } from "express";
import { getProducts, getProductById, getCategories, createProduct, deleteProduct, updateProduct, } from "./product.controller";
import { protect, requireAdmin } from "../../middlewares/auth.middleware";
const router = Router();
// public routes
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);
// protected routes
router.post("/", protect, requireAdmin, createProduct);
router.patch("/:id", protect, requireAdmin, updateProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);
export default router;
