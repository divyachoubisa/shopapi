import prisma from "../../db";
import { CacheKeys, CacheTTL, deleteCache, deleteCachePattern, getCache, setCache, } from "../../utils/cache";
import { getPagination, getPaginationMeta } from "../../utils/pagination";
import { serialize } from "../../utils/serializer";
export async function getProducts(req, res, next) {
    try {
        const queryString = JSON.stringify(req.query);
        const cacheKey = CacheKeys.products(queryString);
        const cached = await getCache(cacheKey);
        if (cached) {
            res.json(cached);
            return;
        }
        const { category, sort } = req.query;
        const pagination = getPagination(req);
        const where = category ? { category } : {};
        const orderBy = sort === "price_asc"
            ? { price: "asc" }
            : sort === "price_desc"
                ? { price: "desc" }
                : { createdAt: "desc" };
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
    }
    catch (error) {
        next(error);
    }
}
export async function getProductById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
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
    }
    catch (error) {
        next(error);
    }
}
export async function getCategories(req, res, next) {
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
    }
    catch (error) {
        next(error);
    }
}
export async function createProduct(req, res, next) {
    try {
        const product = await prisma.product.create({
            data: req.body,
        });
        await deleteCachePattern("products:*");
        res.status(201).json(serialize({ product }));
    }
    catch (error) {
        next(error);
    }
}
export async function updateProduct(req, res, next) {
    try {
        const id = parseInt(req.params.id);
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
    }
    catch (error) {
        next(error);
    }
}
export async function deleteProduct(req, res, next) {
    try {
        const id = parseInt(req.params.id);
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
    }
    catch (error) {
        next(error);
    }
}
