import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError, BadRequestError } from '../../common/errors';

let genAIClient: GoogleGenAI | null = null;

const DEFAULT_GEMINI_TIMEOUT_MS = 45_000;

/**
 * Returns a singleton instance of the GoogleGenAI client.
 * Validates that GEMINI_API_KEY is present in the server environment.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!env.gemini.apiKey || env.gemini.apiKey.trim() === '') {
    throw new AppError(
      503,
      'AI_SERVICE_UNAVAILABLE',
      'AI service is currently not configured on this environment.'
    );
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  }

  return genAIClient;
}

export interface GenerateGeminiContentOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
}

export interface GeminiResponse {
  text: string;
  model: string;
  finishReason?: string;
  usageMetadata?: any;
}

/**
 * Centralized server-side execution function for Google Gemini API.
 * Enforces strict bounded timeouts (Promise.race), client initialization,
 * error sanitization, and structured output.
 */
export async function generateGeminiContent(
  options: GenerateGeminiContentOptions
): Promise<GeminiResponse> {
  const { prompt, systemInstruction, temperature, inlineData, timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS } = options;

  if (!prompt || prompt.trim() === '') {
    throw new BadRequestError('Prompt cannot be empty');
  }

  const client = getGeminiClient();
  const selectedModel = options.model || env.gemini.model || 'gemma-4-31b-it';

  try {
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (temperature !== undefined) {
      config.temperature = temperature;
    }

    let contents: any;
    if (inlineData) {
      contents = [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: inlineData.mimeType,
                data: inlineData.data,
              },
            },
          ],
        },
      ];
    } else {
      contents = prompt;
    }

    // Execute Gemini call with bounded Promise.race timeout
    const generatePromise = client.models.generateContent({
      model: selectedModel,
      contents,
      ...(Object.keys(config).length > 0 ? { config } : {}),
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(
          new AppError(
            504,
            'AI_GATEWAY_TIMEOUT',
            `AI intelligence request timed out after ${timeoutMs}ms. Please retry.`
          )
        );
      }, timeoutMs);

      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const text = response.text || '';
    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason || 'STOP';

    return {
      text,
      model: selectedModel,
      finishReason,
      usageMetadata: response.usageMetadata,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    // Sanitize error message to prevent accidental key exposure
    const rawMessage = error?.message || 'Unknown error occurred during Gemini execution';
    const sanitizedMessage = rawMessage.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');

    logger.error(
      {
        model: selectedModel,
        errorMessage: sanitizedMessage,
        errorCode: error?.status || error?.code,
      },
      'Google Gemini API call failed'
    );

    throw new AppError(503, 'AI_SERVICE_ERROR', `AI Service Unavailable: ${sanitizedMessage}`);
  }
}

/**
 * Health check & verification helper with bounded timeout.
 */
export async function verifyGeminiConnection(): Promise<{
  connected: boolean;
  model: string;
  sampleResponse: string;
}> {
  const result = await generateGeminiContent({
    prompt: 'Respond with exactly: Gemini connection successful.',
    temperature: 0.1,
    timeoutMs: 8000,
  });

  return {
    connected: true,
    model: result.model,
    sampleResponse: result.text.trim(),
  };
}
