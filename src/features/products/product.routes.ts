import { Router } from "express";
import {
  getProducts,
  getProductById,
  getCategories,
} from "./product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);

export default router;
