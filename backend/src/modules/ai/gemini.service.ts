import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { BadRequestError, InternalServerError } from '../../common/errors';

let genAIClient: GoogleGenAI | null = null;

/**
 * Returns a singleton instance of the GoogleGenAI client.
 * Validates that GEMINI_API_KEY is present in the server environment.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!env.gemini.apiKey || env.gemini.apiKey.trim() === '') {
    throw new BadRequestError(
      'GEMINI_API_KEY is missing or not configured on the server. Please set GEMINI_API_KEY in your server environment variables.'
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
 * Handles validation, client initialization, error sanitization, and structured output.
 */
export async function generateGeminiContent(
  options: GenerateGeminiContentOptions
): Promise<GeminiResponse> {
  const { prompt, systemInstruction, temperature, inlineData } = options;

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

    const response = await client.models.generateContent({
      model: selectedModel,
      contents,
      ...(Object.keys(config).length > 0 ? { config } : {}),
    });

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

    throw new InternalServerError(`Gemini API Error: ${sanitizedMessage}`);
  }
}

/**
 * Health check & verification helper.
 */
export async function verifyGeminiConnection(): Promise<{
  connected: boolean;
  model: string;
  sampleResponse: string;
}> {
  const result = await generateGeminiContent({
    prompt: 'Respond with exactly: Gemini connection successful.',
    temperature: 0.1,
  });

  return {
    connected: true,
    model: result.model,
    sampleResponse: result.text.trim(),
  };
}
