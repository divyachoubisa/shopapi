import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../src/config/env";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.databaseUrl }),
});

async function main() {
  const adminEmail = env.adminEmail ?? "admin@shopapi.com";
  const adminPassword = "admin123";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@shopapi.com" },
    update: {},
    create: {
      name: "Test User",
      email: "user@shopapi.com",
      password: await bcrypt.hash("user123", 10),
      role: "USER",
    },
  });

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Hair Wax",
          description: "Strong hold matte finish",
          price: 12,
          stock: 50,
          category: "Hair care",
        },
        {
          name: "Shampoo",
          description: "Daily cleansing shampoo",
          price: 59.99,
          stock: 100,
          category: "Hair care",
        },
        {
          name: 'MacBook Pro 14"',
          description: "Apple M3 chip, 16GB RAM, 512GB SSD",
          price: 1999.99,
          stock: 15,
          category: "laptops",
        },
        {
          name: "Dell XPS 15",
          description: "Intel i7, 32GB RAM, 1TB SSD",
          price: 1799.99,
          stock: 10,
          category: "laptops",
        },
        {
          name: "iPhone 15 Pro",
          description: "A17 Pro chip, 256GB, Titanium",
          price: 999.99,
          stock: 50,
          category: "phones",
        },
        {
          name: "Samsung Galaxy S24",
          description: "Snapdragon 8 Gen 3, 12GB RAM",
          price: 799.99,
          stock: 35,
          category: "phones",
        },
        {
          name: "Sony WH-1000XM5",
          description: "Industry leading noise cancellation",
          price: 349.99,
          stock: 25,
          category: "audio",
        },
        {
          name: "AirPods Pro",
          description: "Active noise cancellation, H2 chip",
          price: 249.99,
          stock: 40,
          category: "audio",
        },
        {
          name: "iPad Air M2",
          description: "11 inch, 256GB, WiFi + Cellular",
          price: 749.99,
          stock: 20,
          category: "tablets",
        },
        {
          name: "Logitech MX Master 3",
          description: "Advanced wireless mouse",
          price: 99.99,
          stock: 60,
          category: "accessories",
        },
      ],
    });
  }

  console.log("Seed complete");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log("User: user@shopapi.com / user123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
