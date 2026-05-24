import { Request, Response, NextFunction } from "express";
import prisma from "../../db";

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      category,
      sort,
      page = "1",
      limit = "10",
    } = req.query as Record<string, string>;

    const where = category ? { category } : {};

    const orderBy =
      sort === "price_asc"
        ? { price: "asc" as const }
        : sort === "price_desc"
          ? { price: "desc" as const }
          : { createdAt: "desc" as const };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: parseInt(limit) }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    res.status(200).json(categories.map((c) => c.category));
  } catch (error) {
    next(error);
  }
}

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, description, price, stock, category } = req.body;

    const product = await prisma.product.create({
      data: { name, description, price, stock, category },
    });

    res.status(201).json({
      message: "Product created successfully",
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(req.params.id as string) },
      data: req.body,
    });

    res.status(200).json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await prisma.product.delete({
      where: { id: parseInt(req.params.id as string) },
    });

    res.status(200).send();
  } catch (error) {
    next(error);
  }
}
