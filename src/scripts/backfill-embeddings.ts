import prisma from "../db";
import { generateEmbedding } from "../lib/embeddings";
import "dotenv/config";

async function backfill() {
  const products = await prisma.product.findMany();

  console.log(`Backfilling ${products.length} products...`);

  for (const product of products) {
    // richer text = better embeddings
    const text = `${product.name}. ${product.description || ""}. Category: ${product.category}. This is a ${product.category} product.`;

    try {
      const embedding = await generateEmbedding(text);
      console.log(
        `Embedding length: ${embedding.length}`,
        embedding.slice(0, 3),
      );

      // convert array to pgvector string format: [0.1, 0.2, ...]
      const vectorString = `[${embedding.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `UPDATE "Product" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        product.id,
      );

      console.log(`✓ ${product.name}`);
    } catch (err) {
      console.error(`✗ ${product.name}:`, err);
    }
  }

  console.log("Backfill complete");
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
