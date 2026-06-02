import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./cart.controller";
import { validate } from "../../middlewares/validate.middleware";
import { AddToCartSchema, UpdateCartItemSchema } from "./cart.schema";

const router = Router();

router.use(protect);

router.get("/", getCart);
router.post("/", validate(AddToCartSchema), addToCart);
router.patch("/:id", validate(UpdateCartItemSchema), updateCartItem);
router.delete("/:id", removeCartItem);
router.delete("/", clearCart);

export default router;
