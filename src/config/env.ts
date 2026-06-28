import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminEmail: required("ADMIN_EMAIL"),
  embeddingProvider: process.env.EMBEDDING_PROVIDER || "ollama",
  ollamaUrl: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
  hfApiKey: process.env.HUGGINGFACE_API_KEY || "",
  port: parseInt(process.env.PORT || "3000"),
  cohereApiKey: process.env.COHERE_API_KEY || "",
};
