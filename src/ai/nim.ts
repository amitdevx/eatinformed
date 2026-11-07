import OpenAI from 'openai';

let nimClientInstance: OpenAI | null = null;

export const getNimClient = (): OpenAI | null => {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!nimClientInstance && apiKey) {
    nimClientInstance = new OpenAI({
      apiKey,
      baseURL: (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, ''),
      timeout: 90 * 1000,
      maxRetries: 2,
    });
  }
  return nimClientInstance;
};

export const isNimConfigured = (): boolean => Boolean(getNimClient());

// ponytail: backwards-compatible proxy that delegates to getNimClient()
export const nimClient = new Proxy({} as any, {
  get(_target, prop) {
    const client = getNimClient();
    if (!client) return undefined;
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Calls NVIDIA NIM chat completions with automatic model fallback on 404/429/5xx.
 */
export async function callNimWithFallback(
  models: string[],
  messages: any[],
  options: { max_tokens?: number; temperature?: number; top_p?: number } = {}
): Promise<string> {
  const client = getNimClient();
  if (!client) {
    throw new Error('AI System Offline: NVIDIA_API_KEY is not configured on the server.');
  }

  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: options.max_tokens ?? 4000,
        temperature: options.temperature ?? 0.05,
        top_p: options.top_p ?? 0.9,
      });

      const choice = response.choices?.[0]?.message as any;
      // ponytail: only fall back to reasoning_content if it actually contains a JSON object
      const content =
        choice?.content?.trim() ||
        (choice?.reasoning_content?.includes('{') ? choice.reasoning_content : null);

      if (content) return content;
      throw new Error(`Empty response from model ${model}`);
    } catch (err: any) {
      lastError = err;
      console.warn(`NIM model "${model}" failed (${err?.status || err?.message}), trying fallback...`);
    }
  }
  throw lastError || new Error('All configured NVIDIA NIM models failed.');
}

/**
 * Robust utility to extract, repair, and parse JSON from LLM responses.
 * Handles markdown code fences, think tags, trailing commas, control characters,
 * and truncated tail closure via LIFO stack.
 */
export const parseNIMResponse = (content: string | null): any => {
  if (!content || content.trim().length === 0) {
    throw new Error('AI returned an empty response.');
  }

  // Strip <think>...</think> blocks from reasoning models before searching for JSON
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Stage 1: Extract from markdown code fences if present
  const allFences = Array.from(cleaned.matchAll(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/gi));
  if (allFences.length > 0) {
    for (let i = allFences.length - 1; i >= 0; i--) {
      const candidate = allFences[i][1].trim();
      const firstB = candidate.indexOf('{');
      const lastB = candidate.lastIndexOf('}');
      if (firstB !== -1 && lastB > firstB) {
        cleaned = candidate.substring(firstB, lastB + 1);
        break;
      }
    }
  }

  // Stage 2: Always use the FIRST opening brace '{'
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error(`AI response does not contain valid JSON: "${cleaned.substring(0, 120)}..."`);
  }

  // Fast path: try outermost braces if balanced
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Continue to repair pipeline
    }
  }

  // Stage 3: LIFO character repair on uncompleted/malformed JSON
  // ponytail: if outermost braces are present, restrict repair to JSON boundaries to avoid trailing commentary/fences
  let toRepair = lastBrace > firstBrace
    ? cleaned.substring(firstBrace, lastBrace + 1)
    : cleaned.substring(firstBrace).replace(/```+\s*$/g, '').trim();

  toRepair = toRepair
    .replace(/(?<=[,{\[\]\d"true"false"null}])\s*\/\/[^\n]*/g, '')
    .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m) =>
      m.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    )
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/,\s*,+/g, ',')
    .replace(/([{\[])\s*,/g, '$1')
    .replace(/,\s*$/, '')
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '');

  // ponytail: LIFO Stack Tracker for exact reverse order bracket/brace closing (Trap B Fix)
  const stack: ('}' | ']')[] = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < toRepair.length; i++) {
    const char = toRepair[i];
    if (char === '"' && !isEscaped) {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
    isEscaped = char === '\\' && !isEscaped;
  }

  if (inString) toRepair += '"';
  while (stack.length > 0) {
    toRepair += stack.pop();
  }

  try {
    return JSON.parse(toRepair);
  } catch (innerError: any) {
    throw new Error(
      `Failed to parse AI response as JSON after repair. ${innerError.message}. Preview: "${toRepair.substring(0, 180)}..."`
    );
  }
};
