import { Request, Response, NextFunction } from "express";
import prisma from "../../db";
import { cartWithItemsArgs } from "../../types/prisma.types";
import { roundMoney, toNumber } from "../../utils/decimal";
import { AddToCartBody, UpdateCartItemBody } from "./cart.types";
import { error } from "console";

async function getOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      ...cartWithItemsArgs,
    });

    if (!cart) {
      return res.json({ items: [], total: 0, itemCount: 0 });
    }

    const total = roundMoney(
      cart.items.reduce(
        (sum, item) => sum + toNumber(item.product.price) * item.quantity,
        0,
      ),
    );
    const itemCount = cart.items.reduce(
      (count, item) => count + item.quantity,
      0,
    );

    res.json({ id: cart.id, items: cart.items, total, itemCount });
  } catch (error) {
    next(error);
  }
}

export async function addToCart(
  req: Request<{}, {}, AddToCartBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ error: `Only ${product.stock} items in stock` });
    }

    const cart = await getOrCreateCart(req.user!.id);

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return res.status(400).json({
          error: `Only ${product.stock} items in stock`,
        });
      }

      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
      return res.json(updated);
    }

    const cartItem = await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
      include: { product: true },
    });
    return res.status(201).json(cartItem);
  } catch (error) {
    next(error);
  }
}

export async function updateCartItem(
  req: Request<{ id: string }, {}, UpdateCartItemBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { quantity } = req.body;
    const itemId = parseInt(req.params.id);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: req.user!.id } },
      include: { product: true },
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (cartItem.product.stock < quantity) {
      return res
        .status(400)
        .json({ error: `Only ${cartItem.product.stock} items in stock` });
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
    return res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function removeCartItem(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const itemId = parseInt(req.params.id);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: req.user!.id } },
    });
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function clearCart(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
