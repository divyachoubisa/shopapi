import { z } from "zod";
export const AddToCartSchema = z.object({
    productId: z.number().int().positive("Invalid product"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
export const UpdateCartItemSchema = z.object({
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
