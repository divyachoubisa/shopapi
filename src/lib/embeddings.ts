import { env } from "../config/env";

const OLLAMA_URL = env.ollamaUrl || "http://localhost:11434";
const HF_API_KEY = env.hfApiKey || "";
const EMBEDDING_PROVIDER = env.embeddingProvider || "ollama";
const COHERE_API_KEY = env.cohereApiKey || "";

const OLLAMA_MODEL = "nomic-embed-text";
const HF_MODEL = "sentence-transformers/all-mpnet-base-v2";

async function generateOllamaEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.statusText}`);
  }
  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

async function generateCohereEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`https://api.cohere.com/v1/embed`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${COHERE_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      texts: [text],
      model: "embed-english-v3.0",
      input_type: "search_document",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cohere failed: ${err}`);
  }
  const data = (await response.json()) as { embeddings: number[][] };
  return data.embeddings[0];
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (EMBEDDING_PROVIDER === "ollama") return generateOllamaEmbedding(text);
  if (EMBEDDING_PROVIDER === "cohere") return generateCohereEmbedding(text);
  throw new Error(`Unknown embedding provider: ${EMBEDDING_PROVIDER}`);
}
