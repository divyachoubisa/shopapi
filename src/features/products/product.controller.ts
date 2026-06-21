import { Request, Response, NextFunction } from "express";
import prisma from "../../db";
import {
  CacheKeys,
  CacheTTL,
  deleteCache,
  deleteCachePattern,
  getCache,
  setCache,
} from "../../utils/cache";
import { getPagination, getPaginationMeta } from "../../utils/pagination";
import { serialize } from "../../utils/serializer";

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const queryString = JSON.stringify(req.query);
    const cacheKey = CacheKeys.products(queryString);

    const cached = await getCache(cacheKey);

    if (cached) {
      res.json(cached);
      return;
    }
    const { category, sort } = req.query as Record<string, string>;
    const pagination = getPagination(req);

    const where = category ? { category } : {};

    const orderBy =
      sort === "price_asc"
        ? { price: "asc" as const }
        : sort === "price_desc"
          ? { price: "desc" as const }
          : { createdAt: "desc" as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.product.count({ where }),
    ]);

    const response = serialize({
      data: products,
      pagination: getPaginationMeta(total, pagination),
    });

    await setCache(cacheKey, response, CacheTTL.products);

    res.json(response);
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
    const id = parseInt(req.params.id as string);
    const cacheKey = CacheKeys.product(id);

    const cached = await getCache(cacheKey);

    if (cached) {
      res.json(cached);
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const response = serialize({ data: product });

    await setCache(cacheKey, response, CacheTTL.product);

    res.json(response);
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
    const cacheKey = CacheKeys.categories();

    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    const response = categories.map((c) => c.category);

    await setCache(cacheKey, response, CacheTTL.categories);

    res.json(response);
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
    const product = await prisma.product.create({
      data: req.body,
    });
    await deleteCachePattern("products:*");

    res.status(201).json(serialize({ product }));
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
    const id = parseInt(req.params.id as string);

    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: req.body,
    });

    await Promise.all([
      deleteCache(CacheKeys.product(id)),
      deleteCachePattern("products:*"),
    ]);

    res.json(serialize({ updated }));
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
    const id = parseInt(req.params.id as string);
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await prisma.product.delete({
      where: { id },
    });

    await Promise.all([
      deleteCache(CacheKeys.product(id)),
      deleteCachePattern("products:*"),
    ]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
