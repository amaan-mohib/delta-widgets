import React from "react";
import { useChatStore } from "../stores/useChatStore";
import {
  Button,
  Caption1,
  Card,
  CardHeader,
  Checkbox,
  Subtitle2,
} from "@fluentui/react-components";
import {
  AddRegular,
  ArrowLeftRegular,
  DeleteRegular,
  EditRegular,
} from "@fluentui/react-icons";
import { deleteModel, providers } from "../utils";

interface ModelListProps {}

const ModelList: React.FC<ModelListProps> = () => {
  const { models, selectedModelId, getAllModels, changeSelectedModel } =
    useChatStore();

  return (
    <div className="settings-container">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {models.length !== 0 && selectedModelId && (
          <Button
            icon={<ArrowLeftRegular />}
            appearance="subtle"
            size="small"
            onClick={() => useChatStore.setState({ settingsScreen: null })}
          />
        )}
        <Subtitle2>Available models</Subtitle2>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 16,
        }}>
        {models.map((model) => (
          <Card
            key={model.id}
            appearance="filled-alternative"
            selected={selectedModelId === model.id}>
            <CardHeader
              header={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginLeft: -8,
                  }}>
                  <Checkbox
                    onChange={() => changeSelectedModel(model.id)}
                    checked={selectedModelId === model.id}
                  />
                  {providers.find((p) => p.value === model.provider)?.name}
                </div>
              }
              description={
                <Caption1>{model.displayName || model.model}</Caption1>
              }
              action={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      useChatStore.setState({
                        editModel: model,
                        settingsScreen: "model",
                      });
                    }}
                    size="small"
                    appearance="transparent"
                    icon={<EditRegular />}
                    aria-label="Edit"
                  />
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteModel(model.id);
                      await getAllModels();
                    }}
                    disabled={models.length <= 1}
                    size="small"
                    appearance="transparent"
                    icon={<DeleteRegular />}
                    aria-label="Delete"
                  />
                </div>
              }
            />
          </Card>
        ))}
        <Button
          icon={<AddRegular />}
          appearance="primary"
          onClick={() => {
            useChatStore.setState({
              editModel: null,
              settingsScreen: "model",
            });
          }}>
          Add new
        </Button>
      </div>
    </div>
  );
};

export default ModelList;
