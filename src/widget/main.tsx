import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FluentProvider } from "@fluentui/react-components";
import { useTheme } from "./theme/useTheme";
import { attachConsole, error } from "@tauri-apps/plugin-log";
import { forwardConsole } from "./utils/utils";

attachConsole();
forwardConsole("error", error);

const Main: React.FC = () => {
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
