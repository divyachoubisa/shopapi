CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "embedding" vector(768);

CREATE INDEX IF NOT EXISTS product_embedding_idx
ON "Product" USING hnsw (embedding vector_cosine_ops);
