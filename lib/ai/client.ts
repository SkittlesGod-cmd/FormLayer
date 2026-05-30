import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!_client) {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }
    _client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: key,
    });
  }
  return _client;
}

// DeepSeek R1 — strong reasoning, accurate scientific knowledge
export const MODEL = "deepseek-reasoner";

// DeepSeek V3 — faster, cheaper for compliance checks
export const MODEL_COMPLIANCE = "deepseek-chat";

export const MAX_TOKENS = 8000;
export const MAX_TOKENS_FORMULATE = 16000;
