
import OpenAI from 'openai';

let nimClientInstance: OpenAI | null = null;

export const getNimClient = (): OpenAI | null => {
  if (!nimClientInstance && process.env.NVIDIA_API_KEY) {
    nimClientInstance = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, ''),
      timeout: 120 * 1000,
    });
  }
  return nimClientInstance;
};

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
 * Expert utility to extract, repair, and parse JSON from LLM responses.
 * Handles markdown code fences, trailing commas, control characters,
 * and other common LLM output quirks.
 * Throws an error with context if JSON cannot be recovered.
 */
export const parseNIMResponse = (content: string | null): any => {
  if (!content || content.trim().length === 0) {
    throw new Error('AI returned an empty response.');
  }

  let cleaned = content.trim();

  // Stage 1: If there are markdown code fences, check from the LAST fence backwards
  const allFences = Array.from(cleaned.matchAll(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g));
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

  // Stage 2: Locate the outermost JSON object
  const firstBrace = cleaned.lastIndexOf('\n{') !== -1 ? cleaned.lastIndexOf('\n{') + 1 : cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(
      `AI response does not contain a JSON object. ` +
      `Response starts with: "${cleaned.substring(0, 120)}..."`
    );
  }

  let jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1);

  // Stage 3: Attempt standard parse first (fast path)
  try {
    return JSON.parse(jsonCandidate);
  } catch (_firstError) {
    // Continue to repair stages
  }

  // Stage 4: Multi-stage repair pipeline
  let repaired = jsonCandidate;

  try {
    // 4a: Remove single-line JS comments (// ...) that are NOT inside strings.
    // We do this carefully by only removing comments at the end of lines.
    repaired = repaired.replace(/(?<=[,{\[\]\d"true"false"null}])\s*\/\/[^\n]*/g, '');

    // 4b: Replace unescaped control characters inside strings (newlines, tabs)
    // LLMs sometimes put literal newlines in JSON string values
    repaired = repaired.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
      return match
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    });

    // 4c: Fix trailing commas in arrays: [..."item",] → [..."item"]
    repaired = repaired.replace(/,\s*]/g, ']');

    // 4d: Fix trailing commas in objects: {..."key": "val",} → {..."key": "val"}
    repaired = repaired.replace(/,\s*}/g, '}');

    // 4e: Fix double/multiple commas: ,, → ,
    repaired = repaired.replace(/,\s*,+/g, ',');

    // 4f: Fix leading commas after opening braces/brackets: {, or [,
    repaired = repaired.replace(/([{\[])\s*,/g, '$1');

    // 4g: Remove any BOM or zero-width characters
    repaired = repaired.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '');

    // ponytail: auto-close truncated JSON strings and braces
    const quotes = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quotes % 2 !== 0) {
      repaired += '"';
    }
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }

    return JSON.parse(repaired);
  } catch (innerError: any) {
    // Provide a detailed error for debugging
    const snippet = jsonCandidate.substring(0, 300);
    throw new Error(
      `Failed to parse AI response as JSON after repair. ` +
      `Parse error: ${innerError.message}. ` +
      `JSON starts with: "${snippet}..."`
    );
  }
};
