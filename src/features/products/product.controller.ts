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
import { generateEmbedding } from "../../lib/embeddings";

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

    generateEmbedding(
      `${product.name}. ${product.description || ""}. Category: ${product.category}. This is a ${product.category} product.`,
    )
      .then(async (embedding) => {
        const vectorString = `[${embedding.join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "Product" SET embedding = $1::vector WHERE id = $2`,
          vectorString,
          product.id,
        );
      })
      .catch((err) => {
        console.error(
          `Error generating embedding for product ${product.name}:`,
          err,
        );
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

    generateEmbedding(
      `${updated.name}. ${updated.description || ""}. Category: ${updated.category}. This is a ${updated.category} product.`,
    )
      .then(async (embedding) => {
        const vectorString = `[${embedding.join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "Product" SET embedding = $1::vector WHERE id = $2`,
          vectorString,
          updated.id,
        );
      })
      .catch((err) => {
        console.error(
          `Error generating embedding for product ${updated.name}:`,
          err,
        );
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

export async function searchProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const queryEmbedding = await generateEmbedding(query.trim());
    console.log("Embedding length:", queryEmbedding.length);

    const vectorString = `[${queryEmbedding.join(",")}]`;
    console.log("Vector string preview:", vectorString.slice(0, 50));

    const results = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        name: string;
        description: string | null;
        price: any;
        stock: number;
        category: string;
        similarity: number;
      }>
    >(
      `SELECT id, name, description, price, stock, category,
              1 - (embedding <=> $1::vector) AS similarity
           FROM "Product"
           WHERE embedding IS NOT NULL
           AND 1 - (embedding <=> $1::vector) > 0.2
           ORDER BY embedding <=> $1::vector
           LIMIT 10`,
      vectorString,
    );

    console.log("Results count:", results.length);
    res.json(serialize({ query, data: results }));
  } catch (err) {
    console.error("Search error:", err);
    next(err);
  }
}
