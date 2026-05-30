import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!_client) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
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

// Nvidia Nemotron 3 Super 120B — free on OpenRouter
export const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

// Same model for compliance
export const MODEL_COMPLIANCE = "nvidia/nemotron-3-super-120b-a12b:free";

export const MAX_TOKENS = 8000;
export const MAX_TOKENS_FORMULATE = 16000;
