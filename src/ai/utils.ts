import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ai-sdk-ollama";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { LanguageModel } from "ai";
import { commands } from "../common/commands";
import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";
import { getStore } from "../common";

const KEYRING_SERVICE_NAME = "delta-widgets";

export const getModelProvider = (config: AIProviderConfig): LanguageModel => {
  switch (config.provider) {
    case "openai":
      return createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        headers: config.headers,
      })(config.model);
    case "anthropic":
      return createAnthropic({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        headers: config.headers,
      })(config.model);
    case "gemini":
      return createGoogleGenerativeAI({
        apiKey: config.apiKey!,
        headers: config.headers,
      })(config.model);
    case "ollama":
      return createOllama({
        baseURL: config.baseURL ?? "http://localhost:11434",
        headers: config.headers,
      })(config.model);
    case "openrouter":
      return createOpenRouter({
        apiKey: config.apiKey!,
        baseURL: config.baseURL ?? "https://openrouter.ai/api/v1",
        headers: config.headers,
      })(config.model);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
};

export const getModels = async () => {
  const store = await getStore();
  const { modelProviders, selectedModelId } = store;
  const models: AIProviderConfig[] = [];
  for (let model of modelProviders || []) {
    const apiKey = await getPassword(
      KEYRING_SERVICE_NAME,
      `model-key-${model.id}`,
    );
    models.push({
      ...model,
      apiKey: apiKey || undefined,
    });
  }
  return {
    models,
    selectedModelId: (selectedModelId as string) || null,
  };
};

export const saveModel = async (
  config: AIProviderConfig,
  models: AIProviderConfig[],
) => {
  let newModels = models.map((m) => ({
    ...m,
    apiKey: undefined,
  }));
  const modelExists = newModels.find((m) => m.id === config.id);
  if (modelExists) {
    newModels = newModels.map((m) =>
      m.id === config.id
        ? {
            ...m,
            ...config,
            apiKey: undefined,
          }
        : m,
    );
  } else {
    newModels.push({ ...config, apiKey: undefined });
  }
  if (config.apiKey) {
    await setPassword(
      KEYRING_SERVICE_NAME,
      `model-key-${config.id}`,
      config.apiKey,
    );
  }

  const pairs = [
    {
      key: "modelProviders",
      value: newModels as any,
    },
  ];
  if (newModels.length === 1) {
    pairs.push({
      key: "selectedModelId",
      value: config.id,
    });
  }

  await commands.writeToStoreCmd({ pairs });
};

export const deleteModel = async (id: string) => {
  const store = await getStore();
  const { modelProviders, selectedModelId } = store;
  const newModels = (modelProviders || []).filter((m: any) => m.id !== id);
  const newSelectedId =
    selectedModelId === id ? newModels[0].id : selectedModelId;
  await commands.writeToStoreCmd({
    pairs: [
      { key: "modelProviders", value: newModels },
      { key: "selectedModelId", value: newSelectedId },
    ],
  });
  try {
    await deletePassword(KEYRING_SERVICE_NAME, `model-key-${id}`);
  } catch (error) {
    console.error(error);
  }
};
