import React, { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  Spinner,
  Subtitle2,
  Text,
  Textarea,
  tokens,
} from "@fluentui/react-components";
import { generateText } from "ai";
import { getModelProvider, saveModel } from "../utils";
import { nanoid } from "nanoid";
import { useChatStore } from "../stores/useChatStore";
import { ArrowLeftRegular } from "@fluentui/react-icons";

export const providers = [
  { name: "OpenAI", value: "openai" },
  { name: "Anthropic", value: "anthropic" },
  { name: "Google Gemini", value: "gemini" },
  { name: "Ollama", value: "ollama" },
  { name: "OpenRouter", value: "openrouter" },
];

const getPlaceholderForProvider = (provider: string) => {
  switch (provider) {
    case "openai":
      return { model: "Eg: gpt-4", baseURL: "https://api.openai.com/v1" };
    case "anthropic":
      return {
        model: "Eg: claude-3",
        baseURL: "https://api.anthropic.com/v1",
      };
    case "gemini":
      return {
        model: "Eg: gemini-2.5-flash",
        baseURL: "",
      };
    case "ollama":
      return {
        model: "Eg: phi4-mini:3.8b",
        baseURL: "http://localhost:11434",
      };
    case "openrouter":
      return {
        model: "Eg: openrouter/free",
        baseURL: "https://openrouter.ai/api/v1",
      };
    default:
      return { model: "Enter your model name", baseURL: "Enter your base URL" };
  }
};

interface ModelFormProps {
  initModel: AIProviderConfig | null;
}

const ModelForm: React.FC<ModelFormProps> = ({ initModel }) => {
  const { models, getAllModels } = useChatStore();
  const [formValues, setFormValues] = useState<Partial<AIProviderConfig>>({});
  const [headerString, setHeaderString] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    if (!initModel) return;

    setFormValues(initModel);
  }, [initModel]);

  const testConnection = async (config: AIProviderConfig) => {
    try {
      setLoading(true);
      setConnectionError("");

      const providerOptions: Record<string, any> = {};

      switch (config.provider) {
        case "openai":
          // o-series/gpt-5 models default to reasoning; minimize it
          providerOptions.openai = {
            reasoningEffort: "low", // or 'low' if 'minimal' unsupported for the model
          };
          break;
        case "anthropic":
          // thinking is opt-in, so omitting providerOptions.anthropic is enough,
          // but being explicit avoids surprises if config sets a default elsewhere
          providerOptions.anthropic = {
            thinking: { type: "disabled" },
          };
          break;
        case "gemini":
          providerOptions.google = {
            thinkingConfig: { thinkingBudget: 0 },
          };
          break;
        case "openrouter":
          // OpenRouter passes through to whatever underlying model you pick;
          // reasoning param mirrors OpenAI-style effort control
          providerOptions.openrouter = {
            reasoning: { effort: "low", exclude: true },
          };
          break;
        case "ollama":
          // Local models only reason if the model itself is a reasoning model
          break;
      }

      await generateText({
        model: getModelProvider(config),
        prompt: "Ping. Respond with pong",
        maxRetries: 0,
        providerOptions,
      });
      await saveModel(config, models);
      await getAllModels();
      useChatStore.setState({
        editModel: null,
        settingsScreen: "list",
      });

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setConnectionError(error.message);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const { provider, apiKey, model } = formValues;

    const newErrors: { [key: string]: string } = {};
    if (!provider) newErrors.provider = "Provider is required";
    if (!model) newErrors.model = "Model is required";
    if (provider !== "ollama" && !apiKey)
      newErrors.apiKey = "API Key is required";

    let headers: AIProviderConfig["headers"];
    if (headerString) {
      try {
        headers = JSON.parse(headerString);
      } catch (error) {
        newErrors.headers = "Headers must be valid JSON";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const config: AIProviderConfig = {
      id: initModel?.id || nanoid(),
      model: model!,
      provider: provider!,
      apiKey: apiKey,
      baseURL: formValues.baseURL,
      displayName: formValues.displayName || model,
      headers,
    };
    await testConnection(config);
  };

  useEffect(() => {
    setHeaderString(
      formValues.headers ? JSON.stringify(formValues.headers, null, 2) : "",
    );
  }, [formValues.headers]);

  const placeholder = getPlaceholderForProvider(formValues.provider || "");

  return (
    <div className="settings-container">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {models.length !== 0 && (
          <Button
            icon={<ArrowLeftRegular />}
            appearance="subtle"
            size="small"
            onClick={() =>
              useChatStore.setState({ settingsScreen: "list", editModel: null })
            }
          />
        )}
        <Subtitle2>
          {models.length === 0
            ? "AI Model Setup"
            : initModel
              ? "Update model"
              : "Add model"}
        </Subtitle2>
      </div>
      <form className="settings-form" onSubmit={onSubmit}>
        <Field
          label="Provider"
          required
          {...(errors.provider
            ? { validationState: "error", validationMessage: errors.provider }
            : {})}>
          <Select
            name="provider"
            value={formValues.provider || ""}
            onChange={(_, { value }) =>
              setFormValues((prev) => ({
                ...prev,
                provider: value as AIProviderConfig["provider"],
              }))
            }>
            <option value="" disabled>
              Select a provider
            </option>
            {providers.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.name}
              </option>
            ))}
          </Select>
        </Field>
        {formValues.provider && (
          <>
            <Field label="Name">
              <Input
                name="displayName"
                placeholder="Eg: Work GPT-5"
                value={formValues.displayName || ""}
                onChange={(_, { value }) =>
                  setFormValues((prev) => ({
                    ...prev,
                    displayName: value,
                  }))
                }
              />
            </Field>
            <Field
              label="Model"
              required
              {...(errors.model
                ? { validationState: "error", validationMessage: errors.model }
                : {})}>
              <Input
                name="model"
                placeholder={placeholder.model}
                value={formValues.model || ""}
                onChange={(_, { value }) =>
                  setFormValues((prev) => ({
                    ...prev,
                    model: value,
                  }))
                }
              />
            </Field>
            {formValues.provider !== "ollama" && (
              <Field
                label="API Key"
                required
                {...(errors.apiKey
                  ? {
                      validationState: "error",
                      validationMessage: errors.apiKey,
                    }
                  : {})}>
                <Input
                  name="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={formValues?.apiKey || ""}
                  onChange={(_, { value }) =>
                    setFormValues((prev) => ({
                      ...prev,
                      apiKey: value,
                    }))
                  }
                />
              </Field>
            )}
            {formValues.provider !== "gemini" && (
              <Field label="Base URL">
                <Input
                  type="url"
                  name="baseURL"
                  placeholder={placeholder.baseURL}
                  value={formValues.baseURL || ""}
                  onChange={(_, { value }) =>
                    setFormValues((prev) => ({
                      ...prev,
                      baseURL: value,
                    }))
                  }
                />
              </Field>
            )}
            <Field
              label="Custom headers"
              {...(errors.headers
                ? {
                    validationState: "error",
                    validationMessage: errors.headers,
                  }
                : {})}>
              <Textarea
                name="headers"
                value={headerString}
                onChange={(_, { value }) => setHeaderString(value)}
              />
            </Field>
          </>
        )}
        {connectionError && (
          <Text
            style={{
              color: tokens.colorPaletteRedForeground1,
              overflowWrap: "break-word",
            }}>
            {connectionError || "asd"}
          </Text>
        )}
        <Button
          appearance="primary"
          type="submit"
          icon={loading ? <Spinner size="extra-tiny" /> : null}
          disabled={!formValues.provider || !formValues.model || loading}>
          {initModel ? "Update" : "Add"}
        </Button>
      </form>
    </div>
  );
};

export default ModelForm;
