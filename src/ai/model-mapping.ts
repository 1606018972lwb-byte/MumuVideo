/**
 * AI Provider Model Mapping Configuration
 *
 * This file defines the mapping between internal model IDs and provider--specific model IDs,
 * along with parameter transformation rules.
 *
 * @version 1.0.0
 * @last-updated 2026-04-30
 */

// ============================================================================
// Type Definitions
// ============================================================================

import type { ProviderType } from "./types";

export type GenerationMode =
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "frames-to-video";

export interface ProviderModelConfig {
  /** Provider-specific model ID */
  providerModelId: string | ((params: Record<string, any>) => string);
  /** API endpoint (optional, if different from default) */
  apiEndpoint?: string;
  /** Parameter transformation function */
  transformParams?: (
    internalModelId: string,
    params: Record<string, any>
  ) => Record<string, any>;
  /** Response transformation function */
  transformResponse?: (response: any) => any;
  /** Whether this provider supports this model */
  supported: boolean;
}

export interface ModelMapping {
  /** Internal unified model ID */
  internalId: string;
  /** Display name */
  displayName: string;
  /** Provider-specific configurations */
  providers: {
    evolink?: ProviderModelConfig;
    kie?: ProviderModelConfig;
    apimart?: ProviderModelConfig;
    yunwu?: ProviderModelConfig;
  };
}

// ============================================================================
// Parameter Transformers
// ============================================================================

/**
 * Yunwu parameter transformer
 */
function yunwuParamsTransformer(
  internalModelId: string,
  params: Record<string, any>
): Record<string, any> {
  const imageUrls = Array.isArray(params.imageUrls)
    ? params.imageUrls
    : params.imageUrl
      ? [params.imageUrl]
      : undefined;

  const result: Record<string, any> = {
    prompt: params.prompt,
    aspect_ratio: params.aspectRatio || "16:9",
    duration: params.duration || 5,
    enhance_prompt: params.enhancePrompt ?? true,
    callback_url: params.callbackUrl,
  };

  if (imageUrls && imageUrls.length > 0) {
    result.image_url = imageUrls[0];
  }

  if (internalModelId === "veo3.1-fast-components") {
    result.duration = params.duration || 5;
  }

  if (internalModelId === "veo3-fast-frames") {
    result.duration = params.duration || 5;
  }

  return result;
}

// ============================================================================
// Model Mappings
// ============================================================================

export const MODEL_MAPPINGS: Record<string, ModelMapping> = {
  // -------------------------------------------------------------------------
  // Veo 3.1 Fast Components (Yunwu - Text to Video)
  // -------------------------------------------------------------------------
  "veo3.1-fast-components": {
    internalId: "veo3.1-fast-components",
    displayName: "Veo 3.1 Fast Components",
    providers: {
      yunwu: {
        providerModelId: "veo3.1-fast-components",
        supported: true,
        transformParams: yunwuParamsTransformer,
      },
    },
  },

  // -------------------------------------------------------------------------
  // Veo 3 Fast Frames (Yunwu - Image to Video)
  // -------------------------------------------------------------------------
  "veo3-fast-frames": {
    internalId: "veo3-fast-frames",
    displayName: "Veo 3 Fast Frames",
    providers: {
      yunwu: {
        providerModelId: "veo3-fast-frames",
        supported: true,
        transformParams: yunwuParamsTransformer,
      },
    },
  },
};

const MODEL_MODE_SUPPORT: Record<
  string,
  Partial<Record<ProviderType, GenerationMode[]>>
> = {
  "veo3.1-fast-components": {
    yunwu: ["text-to-video"],
  },
  "veo3-fast-frames": {
    yunwu: ["image-to-video"],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get provider model ID for internal model
 */
export function getProviderModelId(
  internalModelId: string,
  provider: ProviderType,
  params?: Record<string, any>
): string {
  const mapping = MODEL_MAPPINGS[internalModelId];
  if (!mapping) {
    throw new Error(`Unknown internal model ID: ${internalModelId}`);
  }

  const providerConfig = mapping.providers[provider];
  if (!providerConfig || !providerConfig.supported) {
    throw new Error(
      `Model ${internalModelId} is not supported by provider ${provider}`
    );
  }

  const providerModelId = providerConfig.providerModelId;

  if (typeof providerModelId === "function") {
    return providerModelId(params || {});
  }

  return providerModelId;
}

/**
 * Get provider config for internal model
 */
export function getProviderConfig(
  internalModelId: string,
  provider: ProviderType
): ProviderModelConfig | undefined {
  const mapping = MODEL_MAPPINGS[internalModelId];
  return mapping?.providers[provider];
}

/**
 * Check if a provider supports a specific model
 */
export function isModelSupported(
  internalModelId: string,
  provider: ProviderType
): boolean {
  const mapping = MODEL_MAPPINGS[internalModelId];
  if (!mapping) return false;

  const providerConfig = mapping.providers[provider];
  return providerConfig?.supported || false;
}

export function normalizeGenerationMode(
  mode?: string,
  hasImageInput = false
): GenerationMode {
  switch (mode) {
    case "image-to-video":
    case "reference-to-video":
    case "frames-to-video":
      return mode;
    case "text-image-to-video":
    case "t2v":
    case "text-to-video":
      return hasImageInput ? "image-to-video" : "text-to-video";
    case "i2v":
      return "image-to-video";
    case "r2v":
      return "reference-to-video";
    default:
      return hasImageInput ? "image-to-video" : "text-to-video";
  }
}

export function isModelModeSupported(
  internalModelId: string,
  provider: ProviderType,
  mode: GenerationMode
): boolean {
  if (!isModelSupported(internalModelId, provider)) {
    return false;
  }

  const supportedModes = MODEL_MODE_SUPPORT[internalModelId]?.[provider];
  if (!supportedModes) {
    return false;
  }

  return supportedModes.includes(mode);
}

/**
 * Transform parameters for a specific provider
 */
export function transformParamsForProvider(
  internalModelId: string,
  provider: ProviderType,
  params: Record<string, any>
): Record<string, any> {
  const mapping = MODEL_MAPPINGS[internalModelId];
  if (!mapping) {
    throw new Error(`Unknown internal model ID: ${internalModelId}`);
  }

  const providerConfig = mapping.providers[provider];
  if (!providerConfig || !providerConfig.supported) {
    throw new Error(
      `Model ${internalModelId} is not supported by provider ${provider}`
    );
  }

  if (providerConfig.transformParams) {
    return providerConfig.transformParams(internalModelId, params);
  }

  return params;
}

/**
 * Get all supported models for a provider
 */
export function getSupportedModels(provider: ProviderType): string[] {
  return Object.values(MODEL_MAPPINGS)
    .filter((mapping) => mapping.providers[provider]?.supported)
    .map((mapping) => mapping.internalId);
}

/**
 * Get model display name
 */
export function getModelDisplayName(internalModelId: string): string {
  const mapping = MODEL_MAPPINGS[internalModelId];
  return mapping?.displayName || internalModelId;
}