interface AIProviderConfig {
  id: string;
  displayName?: string;
  provider: "openai" | "anthropic" | "gemini" | "ollama" | "openrouter";
  model: string;
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  options?: Record<string, unknown>;
}
