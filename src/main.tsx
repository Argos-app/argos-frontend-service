import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as AntdApp, ConfigProvider } from "antd";
import ptBR from "antd/es/locale/pt_BR";
import { App } from "@/App";
import { AuthProvider } from "@/context/AuthContext";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: "#06412F",
          colorLink: "#06412F",
          colorText: "#000000",
          colorTextSecondary: "#06412F",
          colorTextPlaceholder: "#52685D",
          colorError: "#A61D24",
          colorBgElevated: "#F4F1EB",
          colorBorder: "#808080",
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
