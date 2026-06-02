import { Router } from "express";
import {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  deleteProduct,
  updateProduct,
} from "./product.controller";
import { protect, requireAdmin } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { CreateProductSchema, UpdateProductSchema } from "./product.schema";

const router = Router();

// public routes
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);

// protected routes
router.post(
  "/",
  protect,
  requireAdmin,
  validate(CreateProductSchema),
  createProduct,
);
router.patch(
  "/:id",
  protect,
  requireAdmin,
  validate(UpdateProductSchema),
  updateProduct,
);
router.delete("/:id", protect, requireAdmin, deleteProduct);

export default router;
