import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!_client) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key || key === "your_openrouter_api_key_here") {
      throw new Error("OPENROUTER_API_KEY is not configured. Add it to .env.local.");
    }
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
      defaultHeaders: {
        "HTTP-Referer": "https://formlayer.co",
        "X-Title": "FormLayer",
      },
    });
  }
  return _client;
}

// Primary model: Claude Sonnet — accurate scientific knowledge, strong structured output
export const MODEL = "anthropic/claude-sonnet-4-5";

// Fallback for compliance-only (lighter, faster)
export const MODEL_COMPLIANCE = "anthropic/claude-haiku-4-5";

export const MAX_TOKENS = 6000;
export const MAX_TOKENS_FORMULATE = 10000;
