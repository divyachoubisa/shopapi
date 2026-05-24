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
};
