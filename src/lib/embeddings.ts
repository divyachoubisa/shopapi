import "dotenv/config";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || "ollama";

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

async function generateHuggingFaceEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (EMBEDDING_PROVIDER === "ollama") {
    return generateOllamaEmbedding(text);
  }
  return generateHuggingFaceEmbedding(text);
}
