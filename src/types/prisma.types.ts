import { Prisma } from "@prisma/client";

export const cartWithItemsArgs = {
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            category: true,
          },
        },
      },
    },
  },
} satisfies Prisma.CartDefaultArgs;

export type CartWithItems = Prisma.CartGetPayload<typeof cartWithItemsArgs>;
