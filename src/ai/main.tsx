import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FluentProvider } from "@fluentui/react-components";
import { useTheme } from "../main/theme/useTheme";

interface MainProps {}

const Main: React.FC<MainProps> = () => {
  const { theme } = useTheme();

  return (
    <FluentProvider theme={theme}>
      <App />
    </FluentProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
