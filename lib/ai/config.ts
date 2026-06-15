/**
 * @fileoverview Configuração de provedores de IA para o CRM.
 *
 * Este módulo abstrai a criação de clientes de diferentes provedores de IA,
 * permitindo trocar entre eles de forma transparente.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import {
  getDefaultModelForProvider,
  type AIProvider,
} from '@/lib/ai/providersCatalog';

export type { AIProvider } from '@/lib/ai/providersCatalog';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENCODE_ZEN_BASE_URL = 'https://opencode.ai/zen/v1';

function createOpenRouterClient(apiKey: string) {
  return createOpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://nossocrm.vercel.app',
      'X-Title': 'YumIA CRM',
    },
  });
}

function createOpenCodeClient(apiKey: string) {
  return createOpenAI({
    apiKey,
    baseURL: OPENCODE_ZEN_BASE_URL,
  });
}

/**
 * Cria e retorna uma instância do modelo de IA configurada.
 */
export const getModel = (provider: AIProvider, apiKey: string, modelId: string) => {
  if (!apiKey) {
    throw new Error('API Key is missing');
  }

  const resolvedModelId = modelId.trim() || getDefaultModelForProvider(provider);

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(resolvedModelId);
    }

    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(resolvedModelId);
    }

    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(resolvedModelId);
    }

    case 'openrouter': {
      const openrouter = createOpenRouterClient(apiKey);
      return openrouter(resolvedModelId);
    }

    case 'opencode': {
      const opencode = createOpenCodeClient(apiKey);
      return opencode(resolvedModelId);
    }

    default:
      throw new Error(`Provider ${provider} not supported`);
  }
};
