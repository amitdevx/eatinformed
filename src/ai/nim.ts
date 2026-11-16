import OpenAI from 'openai';
import { ApiError } from '@/lib/api-error';
let instance: OpenAI | null = null;
export function getNimClient() {
  if (!instance && process.env.NVIDIA_API_KEY?.trim()) instance = new OpenAI({ apiKey: process.env.NVIDIA_API_KEY.trim(), baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1', timeout: 20000, maxRetries: 0 });
  return instance;
}
export const isNimConfigured = () => Boolean(getNimClient());
export async function callNimWithFallback(models: string[], messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], options: { max_tokens?: number; temperature?: number; top_p?: number; deadline?: number; requestId?: string } = {}): Promise<string> {
  const client = getNimClient();
  if (!client) throw new ApiError(503, 'ai_offline', 'Food analysis is temporarily unavailable.');
  const deadline = options.deadline || Date.now() + 45000;
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 1000) throw new ApiError(504, 'upstream_timeout', 'Food analysis timed out.');
    const model = models[Math.min(attempt, models.length - 1)];
    const start = Date.now();
    try {
      const response = await client.chat.completions.create({ model, messages, max_tokens: options.max_tokens || 3800, temperature: options.temperature ?? 0.05, top_p: options.top_p ?? 0.9 }, { signal: AbortSignal.timeout(Math.min(22000, remaining)) });
      console.info(JSON.stringify({ event: 'provider_call', requestId: options.requestId, model, attempt: attempt + 1, durationMs: Date.now() - start, outcome: response.choices[0]?.finish_reason, tokens: response.usage?.total_tokens }));
      if (response.choices[0]?.finish_reason === 'length') throw new ApiError(502, 'ai_output_truncated', 'The analysis was incomplete. Please try again.');
      const content = response.choices[0]?.message.content?.trim();
      if (content && content.length > 100000) throw new ApiError(502, 'invalid_ai_output', 'The analysis response was too large.');
  if (!content) throw new ApiError(502, 'invalid_ai_output', 'The analysis response was incomplete.');
      return content;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const status = error instanceof OpenAI.APIError ? error.status : undefined;
      console.warn(JSON.stringify({ event: 'provider_failure', requestId: options.requestId, model, attempt: attempt + 1, status, durationMs: Date.now() - start }));
      if (status === 401 || status === 403) throw new ApiError(503, 'provider_authentication', 'Food analysis is temporarily unavailable.');
      if (status === 400 || status === 404 || status === 422) throw new ApiError(503, 'provider_configuration', 'Food analysis is temporarily unavailable.');
      if (attempt === 1) throw new ApiError(status === 429 ? 503 : status ? 502 : 504, status === 429 ? 'provider_rate_limited' : status ? 'provider_unavailable' : 'upstream_timeout', 'Food analysis could not complete. Please try again later.');
      await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 250));
    }
  }
  throw new ApiError(502, 'provider_unavailable', 'Food analysis is temporarily unavailable.');
}
export function parseNIMResponse(content: string | null): unknown {
  if (content && content.length > 100000) throw new ApiError(502, 'invalid_ai_output', 'The analysis response was too large.');
  if (!content) throw new ApiError(502, 'invalid_ai_output', 'The analysis response was empty.');
  // Accept only complete JSON, optionally wrapped in a single Markdown fence.
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  try {
    const value = JSON.parse(fenced ? fenced[1] : trimmed);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch { throw new ApiError(502, 'invalid_ai_output', 'The analysis response was invalid.'); }
}
