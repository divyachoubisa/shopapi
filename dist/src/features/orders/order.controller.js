import prisma from "../../db";
import { getPagination, getPaginationMeta } from "../../utils/pagination";
import { serialize } from "../../utils/serializer";
// POST /orders
export async function placeOrder(req, res, next) {
    try {
        const userId = req.user.id;
        const { shippingAddress } = req.body;
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty" });
        }
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} left`,
                });
            }
        }
        const total = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    total,
                    shippingAddress,
                    items: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                        })),
                    },
                },
                include: { items: { include: { product: true } } },
            });
            for (const item of cart.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            return newOrder;
        });
        res.status(201).json({
            message: "Order placed successfully",
            order: {
                id: order.id,
                total: Number(order.total),
                status: order.status,
                items: order.items,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
//GET /orders
export async function getMyOrders(req, res, next) {
    try {
        const pagination = getPagination(req);
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId: req.user.id },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: pagination.skip,
                take: pagination.limit,
            }),
            prisma.order.count({ where: { userId: req.user.id } }),
        ]);
        res.json(serialize({
            data: orders,
            pagination: getPaginationMeta(total, pagination),
        }));
    }
    catch (error) {
        next(error);
    }
}
// GET /orders/:id
export async function getOrderById(req, res, next) {
    try {
        const order = await prisma.order.findFirst({
            where: { id: parseInt(req.params.id), userId: req.user.id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(serialize({ data: order }));
    }
    catch (error) {
        next(error);
    }
}
// PATCH /orders/:id/cancel
export async function cancelOrder(req, res, next) {
    try {
        const order = await prisma.order.findFirst({
            where: { id: parseInt(req.params.id), userId: req.user.id },
            include: { items: true },
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.status !== "PENDING") {
            return res.status(400).json({
                message: `Cannot cancel an order with status ${order.status}`,
            });
        }
        const cancelled = await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
            return tx.order.update({
                where: { id: order.id },
                data: { status: "CANCELLED" },
            });
        });
        return res.json(serialize({ data: cancelled }));
    }
    catch (error) {
        next(error);
    }
}
export async function getAllOrders(req, res, next) {
    try {
        const pagination = getPagination(req);
        const { status } = req.query;
        const where = status ? { status: status } : {};
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: pagination.skip,
                take: pagination.limit,
            }),
            prisma.order.count({ where }),
        ]);
        res.json(serialize({
            data: orders,
            pagination: getPaginationMeta(total, pagination),
        }));
    }
    catch (error) {
        next(error);
    }
}
// PATCH /admin/orders/:id/status
export async function updateOrderStatus(req, res, next) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(req.params.id) },
        });
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        const updated = await prisma.order.update({
            where: { id: order.id },
            data: { status: req.body.status },
        });
        res.json(serialize({ data: updated }));
    }
    catch (error) {
        next(error);
    }
}
