import { db } from '../db/database';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AISettings {
  apiKey: string;
  apiUrl?: string;
}

export async function getAISettings(): Promise<AISettings | null> {
  const profile = await db.userProfiles.toCollection().first();
  if (!profile) return null;
  const raw = profile as unknown as Record<string, unknown>;
  const key = raw.anthropicApiKey as string | undefined;
  if (!key) return null;
  const url = raw.anthropicApiUrl as string | undefined;
  return { apiKey: key, apiUrl: url || ANTHROPIC_API_URL };
}

export async function saveAISettings(apiKey: string, apiUrl?: string): Promise<void> {
  const profile = await db.userProfiles.toCollection().first();
  if (profile?.id) {
    await db.userProfiles.update(profile.id, {
      anthropicApiKey: apiKey,
      anthropicApiUrl: apiUrl || ANTHROPIC_API_URL,
    } as Record<string, unknown>);
  }
}

interface MessageContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

export async function sendAIMessage(
  messages: AIMessage[],
  systemPrompt: string
): Promise<string> {
  const settings = await getAISettings();
  if (!settings?.apiKey) {
    throw new Error('Geen API-sleutel ingesteld. Ga naar Profiel → AI Instellingen.');
  }

  const response = await fetch(settings.apiUrl || ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = (errorData as Record<string, Record<string, string>>)?.error?.message || response.statusText;
    throw new Error(`AI fout: ${msg}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'Geen antwoord ontvangen.';
}

export async function recognizeFoodFromImage(base64Image: string, mediaType: string): Promise<string> {
  const systemPrompt = `Je bent een Nederlandse voedingsassistent. Analyseer de foto van voedsel.
Geef voor elk herkend product:
- Naam (in het Nederlands)
- Geschatte hoeveelheid in gram
- Geschatte voedingswaarden per 100g: calorieën, eiwit, vet, verzadigd vet, koolhydraten, suikers, vezels

Antwoord in JSON-formaat:
[{"naam": "...", "hoeveelheid_g": 100, "per_100g": {"calories": 0, "protein": 0, "fat": 0, "saturatedFat": 0, "carbs": 0, "sugar": 0, "fiber": 0}}]

Als je geen voedsel herkent, antwoord dan met een lege array [].`;

  return sendAIMessage(
    [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text', text: 'Welk voedsel zie je op deze foto? Geef de voedingswaarden.' },
      ],
    }],
    systemPrompt
  );
}
