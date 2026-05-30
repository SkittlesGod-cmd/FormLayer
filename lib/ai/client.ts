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

// Primary model: Llama 3.3 70B — best free model for scientific structured output
// Upgrade path: switch to "anthropic/claude-sonnet-4-5" with paid OpenRouter credits
export const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

// Compliance model: same free model
export const MODEL_COMPLIANCE = "meta-llama/llama-3.3-70b-instruct:free";

export const MAX_TOKENS = 5000;
export const MAX_TOKENS_FORMULATE = 8000;
