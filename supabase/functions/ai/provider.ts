import { schemaFor, type Action } from "./schema.ts";
import { SYSTEM } from "./prompts.ts";
import type { PdfFile } from "./validation.ts";

export class GeminiError extends Error {
  code: "busy" | "refused" | "too_long" | "empty" | "server_error";
  constructor(code: GeminiError["code"], message: string = code) {
    super(message);
    this.code = code;
  }
}

/** One generateContent call with JSON output (plus an optional PDF); returns the parsed object. */
export function createGemini(apiKey: string, model: string) {
  return async function gemini(action: Action, prompt: string, pdf?: PdfFile, system = SYSTEM): Promise<unknown> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(45_000),
    redirect: "error",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [...(pdf ? [{ inlineData: { mimeType: "application/pdf", data: pdf.data } }] : []), { text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schemaFor(action),
        maxOutputTokens: 4096,
        // Gemini 3 only; older models use thinkingBudget and reject thinkingLevel.
        ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: "minimal" } } : {}),
      },
    }),
  });
  if (res.status === 429 || res.status === 503) throw new GeminiError("busy");
  if (!res.ok) {
    // 400 apiKey_INVALID, 403 permission, 404 unknown model… — all a setup problem.
    // Google's error message never contains the key, so admins get it back to debug.
    const raw = await res.text();
    let reason = raw.slice(0, 300);
    try {
      reason = JSON.parse(raw).error?.message ?? reason;
    } catch {
      /* not JSON */
    }
    throw new GeminiError("server_error", `Gemini ${res.status} (${model}): ${reason}`);
  }
  const data = await res.json();
  if (data.promptFeedback?.blockReason) throw new GeminiError("refused");
  const candidate = data.candidates?.[0];
  if (!candidate) throw new GeminiError("empty", `Gemini returned no candidates: ${JSON.stringify(data).slice(0, 300)}`);
  if (candidate.finishReason === "MAX_TOKENS") throw new GeminiError("too_long");
  if (candidate.finishReason && candidate.finishReason !== "STOP") throw new GeminiError("refused");
  const text = (candidate.content?.parts ?? [])
    .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
    .map((p: { text: string }) => p.text)
    .join("");
  if (!text) throw new GeminiError("empty", `Gemini returned no text (finishReason ${candidate.finishReason})`);
  return JSON.parse(text);
}

}
