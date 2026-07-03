import { GoogleAuth } from 'google-auth-library';
import { config } from '../../config';
import { AppError } from '../../lib/errors';

/** Albanian (Shqip) source content for a property listing. */
export type TranslateInput = { title: string; description?: string };

/** English + German output for each provided field. */
export type TranslateOutput = {
  title: { en: string; de: string };
  description: { en: string; de: string };
};

const SYSTEM_INSTRUCTION =
  'You are a professional real-estate translator. You translate property listing ' +
  'text from Albanian (Shqip) into English and German. Preserve the meaning, tone, ' +
  'and any numbers/measurements exactly. Produce natural, professional marketing ' +
  'copy - do not add facts that are not present, do not include the source text, ' +
  'and do not add commentary. If a field is empty, return an empty string for it.';

/** Gemini structured-output schema: forces the model to return exactly these keys. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    titleEn: { type: 'string' },
    titleDe: { type: 'string' },
    descriptionEn: { type: 'string' },
    descriptionDe: { type: 'string' },
  },
  required: ['titleEn', 'titleDe', 'descriptionEn', 'descriptionDe'],
} as const;

/**
 * Lazily-created Google auth client (Vertex mode). The library caches and
 * auto-refreshes the access token, so it's safe to call getAccessToken per request.
 */
let googleAuth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (!googleAuth) {
    googleAuth = new GoogleAuth({
      // cloud-platform covers Vertex + the x-goog-user-project (serviceusage) header;
      // generative-language is required by generativelanguage.googleapis.com over OAuth.
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/generative-language',
      ],
      // Falls back to ADC / GOOGLE_APPLICATION_CREDENTIALS env when keyFilename is undefined.
      keyFilename: config.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return googleAuth;
}

/** Resolve the request URL + auth headers for whichever provider is configured. */
async function resolveEndpoint(): Promise<{ url: string; headers: Record<string, string> }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const useServiceAccount = Boolean(config.GOOGLE_APPLICATION_CREDENTIALS) || config.GEMINI_USE_VERTEX;

  // Service-account (OAuth bearer) mode.
  if (useServiceAccount) {
    const auth = getAuth();
    let token: string | null | undefined;
    let projectId: string;
    try {
      token = await auth.getAccessToken();
      projectId = config.GOOGLE_CLOUD_PROJECT || (await auth.getProjectId());
    } catch (err) {
      throw new AppError(502, 'Could not obtain a Google service-account token.', 'translation_failed', String(err));
    }
    if (!token) {
      throw new AppError(502, 'Google service-account returned an empty access token.', 'translation_failed');
    }
    headers.authorization = `Bearer ${token}`;

    // Vertex AI endpoint (opt-in).
    if (config.GEMINI_USE_VERTEX) {
      const location = config.GCP_LOCATION;
      const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
      const url =
        `https://${host}/v1/projects/${projectId}/locations/${location}` +
        `/publishers/google/models/${config.GEMINI_MODEL}:generateContent`;
      return { url, headers };
    }

    // Generative Language API ("Gemini API") with OAuth - needs a quota project header.
    headers['x-goog-user-project'] = projectId;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI_MODEL}:generateContent`;
    return { url, headers };
  }

  // API key mode (Generative Language API).
  if (config.GEMINI_API_KEY) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI_MODEL}:generateContent` +
      `?key=${config.GEMINI_API_KEY}`;
    return { url, headers };
  }

  throw new AppError(
    503,
    'Translation is not configured. Set GOOGLE_APPLICATION_CREDENTIALS (service account) or GEMINI_API_KEY.',
    'translation_unavailable',
  );
}

/**
 * Translate Albanian property title/description into English and German via Gemini
 * (Vertex AI service account, or AI Studio API key as fallback).
 * Throws AppError (503) when unconfigured, (502) on upstream failure.
 */
export async function translatePropertyContent(input: TranslateInput): Promise<TranslateOutput> {
  const { url, headers } = await resolveEndpoint();

  const userText = JSON.stringify({ title: input.title, description: input.description ?? '' });
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: `Translate this listing JSON:\n${userText}` }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (err) {
    throw new AppError(502, 'Could not reach the translation service.', 'translation_failed', String(err));
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AppError(502, `Translation service error (${res.status}).`, 'translation_failed', detail.slice(0, 500));
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AppError(502, 'Translation service returned no content.', 'translation_failed');
  }

  let parsed: { titleEn?: string; titleDe?: string; descriptionEn?: string; descriptionDe?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError(502, 'Translation service returned malformed output.', 'translation_failed');
  }

  return {
    title: { en: parsed.titleEn ?? '', de: parsed.titleDe ?? '' },
    description: { en: parsed.descriptionEn ?? '', de: parsed.descriptionDe ?? '' },
  };
}
