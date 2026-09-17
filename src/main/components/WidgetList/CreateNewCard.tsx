import { Card, Text, tokens } from "@fluentui/react-components";
import React from "react";
import { useAddDialogStore } from "../../stores/useAddDialogStore";
import { AppsAddInRegular } from "@fluentui/react-icons";

interface CreateNewCardProps {}

const CreateNewCard: React.FC<CreateNewCardProps> = () => {
  return (
    <Card
      style={{ minHeight: "180px", height: "100%", justifyContent: "center" }}
      onClick={() => useAddDialogStore.setState({ openCreateMenu: true })}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "3px",
          minHeight: 150,
        }}>
        <AppsAddInRegular fontSize="32px" />
        <Text weight="semibold">Create new widget</Text>
        <Text
          align="center"
          size={200}
          style={{ marginTop: 5, color: tokens.colorNeutralForeground2 }}>
          Build a custom widget for your desktop
        </Text>
      </div>
    </Card>
  );
};

export default CreateNewCard;
