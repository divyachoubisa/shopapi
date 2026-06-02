import { Router } from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "./order.controller";
import { PlaceOrderSchema, UpdateOrderStatusSchema } from "./order.schema";
import { protect, requireAdmin } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.use(protect);

router.post("/", validate(PlaceOrderSchema), placeOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

router.get("/admin/orders", requireAdmin, getAllOrders);
router.patch(
  "/admin/orders/:id/status",
  requireAdmin,
  validate(UpdateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
