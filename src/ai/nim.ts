import OpenAI from 'openai';

let nimClientInstance: OpenAI | null = null;

export const getNimClient = (): OpenAI | null => {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!nimClientInstance && apiKey) {
    nimClientInstance = new OpenAI({
      apiKey,
      baseURL: (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, ''),
      timeout: 22 * 1000, // 22s per request so Step 1 + fallback never exceeds 60s HTTP ceiling
      maxRetries: 0,      // Handled explicitly inside callNimWithFallback
    });
  }
  return nimClientInstance;
};

export const isNimConfigured = (): boolean => Boolean(getNimClient());

export const nimClient = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getNimClient();
    if (!client) {
      throw new Error('AI System Offline: NVIDIA_API_KEY is not configured on the server.');
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Calls NVIDIA NIM chat completions with thinking disabled for fast JSON output
 * and automatic retry/fallback if a model returns an empty response or 429/5xx.
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

  // Ensure system directive disables long chain-of-thought reasoning on Nemotron 3.5 / Qwen 3.5
  const hasSystem = messages.some((m) => m.role === 'system');
  const preparedMessages = hasSystem
    ? messages.map((m) =>
        m.role === 'system'
          ? { ...m, content: `detailed thinking off\n${m.content}` }
          : m
      )
    : [
        {
          role: 'system',
          content: 'detailed thinking off. You are a fast, strict JSON extraction API. Output ONLY valid raw JSON.',
        },
        ...messages,
      ];

  let lastError: any = null;

  for (const model of models) {
    // Allow up to 2 attempts per model in case free-tier NIM drops or returns empty content on cold start
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await (client.chat.completions.create as any)({
          model,
          messages: preparedMessages,
          max_tokens: options.max_tokens ?? 4096,
          temperature: options.temperature ?? 0.1,
          top_p: options.top_p ?? 0.9,
          chat_template_kwargs: {
            thinking: false,
            enable_thinking: false,
          },
        });

        const choice = response.choices?.[0]?.message as any;
        const rawContent = choice?.content?.trim() || '';
        const rawReasoning = choice?.reasoning_content?.trim() || '';

        const content =
          rawContent ||
          (rawReasoning.includes('{') ? rawReasoning : '');

        if (content) {
          return content;
        }
        throw new Error(`Empty response from model ${model}`);
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          // Don't retry same model on auth or 404 model-not-found errors
          break;
        }
        console.warn(
          `[NIM] Model "${model}" attempt ${attempt} failed (${err?.message || status}).`
        );
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
  }

  throw lastError || new Error('All configured NVIDIA NIM models failed.');
}

/**
 * Repairs unescaped inner double-quotes, missing opening quotes after colons,
 * literal newlines inside strings, trailing commas, and truncated brackets/braces.
 */
function repairJsonStringsAndStructure(input: string): string {
  // 1. Fix missing opening quote after colon: e.g. "description": A blend of spices", -> "description": "A blend of spices",
  let s = input.replace(
    /(":\s*)(?!(?:true|false|null|-?\d|["{\[]))([A-Za-z][^"\n}]*?)"(\s*[,}\]])/g,
    '$1"$2"$3'
  );

  // 2. State-machine pass: escape literal newlines/tabs AND unescaped inner quotes inside JSON strings
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        inString = true;
        out += '"';
      } else {
        // Peek ahead past whitespace to check if this quote is a true JSON string delimiter
        let j = i + 1;
        while (j < s.length && (s[j] === ' ' || s[j] === '\t' || s[j] === '\r' || s[j] === '\n')) {
          j++;
        }
        const nextCh = j < s.length ? s[j] : '';
        const isTrueClosingQuote =
          nextCh === '' ||
          nextCh === ':' ||
          nextCh === ',' ||
          nextCh === '}' ||
          nextCh === ']';

        if (isTrueClosingQuote) {
          inString = false;
          out += '"';
        } else {
          // It's an unescaped inner quote inside a string (e.g. ""A blend... or "A "blend" of...): escape it!
          out += '\\"';
        }
      }
      continue;
    }

    if (inString) {
      if (ch === '\n') {
        out += '\\n';
      } else if (ch === '\r') {
        out += '\\r';
      } else if (ch === '\t') {
        out += '\\t';
      } else {
        out += ch;
      }
    } else {
      out += ch;
    }
  }

  if (inString) {
    out += '"';
  }

  // 3. Clean structural comma glitches outside strings
  out = out
    .replace(/,\s*,+/g, ',')
    .replace(/(,\s*)+([\]}])/g, '$2')
    .replace(/([{\[])\s*,+/g, '$1')
    .replace(/,\s*$/g, '')
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '');

  // 4. Balance any unclosed brackets/braces in LIFO order
  inString = false;
  escaped = false;
  const stack: ('}' | ']')[] = [];

  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if ((ch === '}' || ch === ']') && stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  while (stack.length > 0) {
    out += stack.pop();
  }

  return out.replace(/(,\s*)+([\]}])/g, '$2');
}

export const parseNIMResponse = (content: string | null): any => {
  if (!content || content.trim().length === 0) {
    throw new Error('AI returned an empty response.');
  }

  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (cleaned.startsWith('<think>') && cleaned.indexOf('{') !== -1) {
    cleaned = cleaned.substring(cleaned.indexOf('{'));
  }

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

  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```+$/g, '').trim();

  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error(
      `AI response does not contain a JSON object. Starts with: "${cleaned.substring(0, 100)}..."`
    );
  }

  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace > firstBrace) {
    const fastCandidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(fastCandidate);
    } catch {
      // Proceed to full state-machine repair
    }
  }

  const candidateToRepair = cleaned.substring(
    firstBrace,
    lastBrace > firstBrace ? lastBrace + 1 : undefined
  );

  const repaired = repairJsonStringsAndStructure(candidateToRepair);
  return JSON.parse(repaired);
};
