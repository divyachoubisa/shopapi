/*
  Warnings:

  - You are about to drop the column `embedding` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "product_embedding_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "embedding";
