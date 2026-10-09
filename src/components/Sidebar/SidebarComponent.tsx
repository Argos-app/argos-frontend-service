import { BoxesIcon, ChartAreaIcon, CircleUserIcon, LogOutIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon } from "lucide-react";
import { useDeferredValue, useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { CollapsibleItem } from "@/components/Sidebar/CollapsibleItem";
import { menuItemClass } from "@/components/Sidebar/menuItemClass";
import type { SidebarMenuItem } from "@/types/sidebar.type";
import Logo  from "@/assets/logo_main.svg";
import { Link } from "react-router";
import { useAuthActions } from "@/hooks/useAuthActions";
import { SearchComponent } from "@/components/Search/SearchComponent";

type MenuGroup = {
  label: string;
  icon: ReactNode;
  items: SidebarMenuItem[];
};

type MenuAction = {
  label: string;
  icon: ReactNode;
};

const menuGroups: MenuGroup[] = [
  {
    label: "Gestão Executiva",
    icon: <BoxesIcon />,
    items: [
      { label: "Gerenciar acessos", to: "/gestao-acessos" },
      { label: "Gerenciar Usuários", to: "/gestao-usuarios" },
      { label: "Gerenciar Propriedades", to: "/gestao-propriedades" },
      { label: "Histórico de Aplicações" },
    ],
  },
  { label: "Dashboard", icon: <ChartAreaIcon />, items: [{ label: "Desempenho do Lote" }] },
];

const menuActions: MenuAction[] = [
  { label: "Perfil", icon: <CircleUserIcon /> },
  { label: "Configurações", icon: <SettingsIcon /> },
  { label: "Log Out", icon: <LogOutIcon /> },
];

function useSidebarFilter(query: string) {
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
  const groups = menuGroups
    .map((group) => ({
      ...group,
      items: group.label.toLocaleLowerCase().includes(normalizedQuery)
        ? group.items
        : group.items.filter((item) => item.label.toLocaleLowerCase().includes(normalizedQuery)),
    }))
    .filter((group) => group.items.length > 0);
  const actions = menuActions.filter((action) => action.label.toLocaleLowerCase().includes(normalizedQuery));

  return { groups, actions, isFiltering: normalizedQuery.length > 0 };
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia("(max-width: 640px)").matches);
  const [searchQuery, setSearchQuery] = useState("");
  const { groups, actions, isFiltering } = useSidebarFilter(collapsed ? "" : searchQuery);
  const { handleLogout, loading, error } = useAuthActions();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const collapseOnSmallScreens = () => setCollapsed(mediaQuery.matches);

    mediaQuery.addEventListener("change", collapseOnSmallScreens);
    return () => mediaQuery.removeEventListener("change", collapseOnSmallScreens);
  }, []);

  return (
    <aside
      className={clsx(
        "relative flex h-screen min-h-screen flex-col rounded-xl bg-brand-cream bg-clip-border p-4 text-brand-forest shadow-xl shadow-brand-ink/5 transition-[width] duration-200",
        collapsed ? "w-22" : "w-full max-w-[20rem]",
      )}
    >
      <div className={clsx("mb-2 flex items-center", collapsed ? "justify-center" : "justify-between gap-4 p-4")}>
        <Link to="/home" aria-label="Página inicial do Argos">
          <img
            src={Logo}
            alt="Argos"
            className={collapsed ? "hidden" : "max-w-full"}
          />
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-brand-forest transition-colors hover:bg-brand-sand/50 focus:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-forest"
        >
          {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
        </button>
      </div>

      {!collapsed && (
      <div className="mt-6 p-2">
        <SearchComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder="Pesquisar no menu" />
      </div>
      )}

      <nav aria-label="Navegação principal" className={clsx("flex flex-col gap-1 p-2 text-base font-normal text-brand-forest", collapsed ? "min-w-0" : "min-w-60")}>
        {groups.map((group) => (
          <CollapsibleItem
            key={`${group.label}:${isFiltering}`}
            label={group.label}
            icon={group.icon}
            items={group.items}
            collapsed={collapsed}
          />
        ))}

        {groups.length > 0 && actions.length > 0 && <hr className="my-2 border-brand-sand" />}

        {actions.map((action) => (
          <button key={action.label} type="button" disabled={loading && action.label === "Log Out"} className={menuItemClass(collapsed)} aria-label={collapsed ? action.label : undefined} onClick={action.label === "Log Out" ? handleLogout : undefined}>
            <span className={clsx("grid place-items-center", !collapsed && "mr-4")}>
              {action.icon}
            </span>
            {!collapsed && action.label}
          </button>
        ))}

        {groups.length === 0 && actions.length === 0 && <p className="px-3 py-2 text-sm text-brand-forest">Nenhum resultado encontrado.</p>}
        {loading && <p role="status" aria-live="polite">Encerrando sessão...</p>}
        {error && <p role="alert" className="text-sm text-brand-ink">{error}</p>}
      </nav>
    </aside>
  );
}
