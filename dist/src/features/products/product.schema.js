import z from "zod";
export const CreateProductSchema = z.object({
    name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters long" }),
    description: z.string().optional(),
    price: z
        .number()
        .positive()
        .min(0, { message: "Price must be greater than 0" }),
    stock: z.number().int().min(0, { message: "Stock must be greater than 0" }),
    category: z
        .string()
        .min(3, { message: "Category must be at least 3 characters long" }),
});
export const UpdateProductSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().min(1).optional(),
});
