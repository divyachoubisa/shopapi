import { z } from "zod";

export const PlaceOrderSchema = z.object({
  shippingAddress: z.string().min(10, "Please provide a full shipping address"),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
