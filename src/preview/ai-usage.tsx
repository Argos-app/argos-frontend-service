import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { BoxesIcon, ChartAreaIcon, CircleUserIcon, LogOutIcon } from "lucide-react";
import Logo from "@/assets/logo_main.svg";
import { CollapsibleItem } from "@/components/Sidebar/CollapsibleItem";
import { SearchComponent } from "@/components/Search/SearchComponent";
import { AiUsagePanel } from "@/pages/aiUsage/AiUsagePanel";
import type { AiUsageUser } from "@/types/ai-usage.type";
import "@/index.css";

const users: AiUsageUser[] = [
  { userId: "1", name: "Maria Silva", email: "maria@exemplo.com", photoUrl: null, calls: 58, modelCalls: 95, tokens: 32100, unknownTokenCalls: 2, costUsd: "0.145", knownCostCalls: 93, unknownCostCalls: 2 },
  { userId: "2", name: "João Oliveira", email: "joao@exemplo.com", photoUrl: null, calls: 42, modelCalls: 71, tokens: 24750, unknownTokenCalls: 0, costUsd: "0.092", knownCostCalls: 71, unknownCostCalls: 0 },
  { userId: "3", name: "Ana Costa", email: "ana@exemplo.com", photoUrl: null, calls: 29, modelCalls: 45, tokens: 15300, unknownTokenCalls: 1, costUsd: "0.061", knownCostCalls: 44, unknownCostCalls: 1 },
  { userId: "4", name: "Pedro Ferreira", email: "pedro@exemplo.com", photoUrl: null, calls: 18, modelCalls: 31, tokens: 10300, unknownTokenCalls: 0, costUsd: "0.042", knownCostCalls: 31, unknownCostCalls: 0 },
];

function Preview() {
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [menuQuery, setMenuQuery] = useState("");
  const groups = [
    { label: "Gestão Executiva", icon: <BoxesIcon />, items: [{ label: "Gerenciar acessos" }, { label: "Gerenciar Usuários" }, { label: "Gerenciar Propriedades" }] },
    { label: "Relatórios", icon: <ChartAreaIcon />, items: [{ label: "Relatórios de rebanho" }, { label: "Uso de IA", to: "/uso-ia" }] },
  ].map((group) => ({ ...group, items: group.label.toLocaleLowerCase().includes(menuQuery.trim().toLocaleLowerCase()) ? group.items : group.items.filter((item) => item.label.toLocaleLowerCase().includes(menuQuery.trim().toLocaleLowerCase())) })).filter((group) => group.items.length > 0);
  return <div className="flex h-screen flex-col bg-brand-cream">
    <div className="shrink-0 bg-brand-forest px-4 py-2 text-center text-xs text-brand-cream">Prévia ilustrativa · Dados fictícios · Nenhuma conexão com o backend</div>
    <div className="flex min-h-0 flex-1">
      <aside className="hidden h-full w-full max-w-[20rem] flex-col rounded-xl bg-brand-cream p-4 text-brand-forest shadow-xl shadow-brand-ink/5 md:flex">
        <div className="p-4"><img src={Logo} alt="Argos" className="max-w-full" /></div>
        <div className="mt-6 p-2"><SearchComponent searchQuery={menuQuery} setSearchQuery={setMenuQuery} placeholder="Pesquisar no menu" /></div>
        <nav aria-label="Menu ilustrativo" className="flex flex-col gap-1 p-2">
          {groups.map((group) => <CollapsibleItem key={group.label} {...group} collapsed={false} />)}
          <hr className="my-2 border-brand-sand" />
          <div className="flex items-center gap-4 p-3"><CircleUserIcon /> Perfil</div>
          <div className="flex items-center gap-4 p-3"><LogOutIcon /> Log Out</div>
        </nav>
      </aside>
      <AiUsagePanel users={users} loading={false} error={null} updatedAt={updatedAt} onRefresh={() => setUpdatedAt(new Date())} />
    </div>
  </div>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><ConfigProvider theme={{ token: { colorPrimary: "#06412F", colorLink: "#06412F", colorText: "#000000", colorTextSecondary: "#06412F", colorBgElevated: "#F4F1EB", colorBorder: "#808080", borderRadius: 12 } }}><AntdApp><MemoryRouter initialEntries={["/uso-ia"]}><Preview /></MemoryRouter></AntdApp></ConfigProvider></StrictMode>,
);
