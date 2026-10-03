import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as AntdApp, ConfigProvider } from "antd";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#06412F",
          colorText: "#000000",
          colorTextSecondary: "#06412F",
          colorBgElevated: "#F4F1EB",
          colorBorder: "#D0C6B2",
          colorError: "#000000",
          colorWarning: "#62BB4D",
          borderRadius: 12,
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
);
