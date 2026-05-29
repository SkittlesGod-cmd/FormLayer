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
        "HTTP-Referer": "https://nutracloud.app",
        "X-Title": "NutraCloud",
      },
    });
  }
  return _client;
}

export const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
export const MAX_TOKENS = 4096;
