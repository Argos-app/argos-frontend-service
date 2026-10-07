import { BoxesIcon, ChartAreaIcon, ChevronDownIcon, CircleUserIcon, LogOutIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon } from "lucide-react";
import { useDeferredValue, useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import Logo  from "../../assets/logo_main.svg";
import { Link, useLocation } from "react-router";
import { useAuthActions } from "../../hooks/useAuthActions";
import { SearchComponent } from "../Search/SearchComponent";

type MenuItem = {
  label: string;
  to?: string;
};

type CollapsibleItemProps = {
  label: string;
  icon: ReactNode;
  items: MenuItem[];
  collapsed: boolean;
};

type MenuGroup = {
  label: string;
  icon: ReactNode;
  items: MenuItem[];
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
      { label: "Gerenciar acessos" },
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

const menuItemClass = (collapsed: boolean) =>
  clsx(
    "flex w-full items-center rounded-lg text-left text-brand-forest transition-colors hover:bg-brand-sand/50 hover:text-brand-ink focus:bg-brand-sand/50 focus:text-brand-ink focus:outline-none",
    collapsed ? "h-11 justify-center" : "p-3 text-base font-normal leading-tight active:bg-brand-sand/50 active:text-brand-ink",
  );

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
  const { handleLogout } = useAuthActions();

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
          title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
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

      <nav className={clsx("flex flex-col gap-1 p-2 text-base font-normal text-brand-forest", collapsed ? "min-w-0" : "min-w-60")}>
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
          <button key={action.label} type="button" className={menuItemClass(collapsed)} aria-label={action.label} title={collapsed ? action.label : undefined} onClick={action.label === "Log Out" ? handleLogout : undefined}>
            <span className={clsx("grid place-items-center", !collapsed && "mr-4")}>
              {action.icon}
            </span>
            {!collapsed && action.label}
          </button>
        ))}

        {groups.length === 0 && actions.length === 0 && <p className="px-3 py-2 text-sm text-brand-forest/70">Nenhum resultado encontrado.</p>}
      </nav>
    </aside>
  );
}

function CollapsibleItem({ label, icon, items, collapsed }: CollapsibleItemProps) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const submenuId = `sidebar-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="relative block w-full">
      <button type="button" onClick={() => !collapsed && setOpen((current) => !current)} aria-expanded={!collapsed && open} aria-controls={submenuId} className={clsx(menuItemClass(collapsed), !collapsed && "justify-between")} aria-label={label} title={collapsed ? label : undefined}>
        <span className={clsx("grid place-items-center", !collapsed && "mr-4")}>{icon}</span>
        {!collapsed && (
          <>
            <span className="mr-auto text-base font-normal leading-relaxed text-brand-ink">{label}</span>
            <span className="ml-4">
              <ChevronDownIcon className={clsx("transition-transform", open && "rotate-180")} />
            </span>
          </>
        )}
      </button>

      <div id={submenuId} hidden={collapsed || !open} className="overflow-hidden py-1">
          <nav className="flex min-w-60 flex-col gap-1">
            {items.map((item) => {
              const isActive = Boolean(item.to) && location.pathname === item.to;
              const className = clsx(
                menuItemClass(false),
                isActive &&
                  "bg-brand-sand text-brand-ink hover:bg-brand-forest hover:text-brand-cream focus:bg-brand-forest focus:text-brand-cream active:bg-brand-forest active:text-brand-cream",
              );

              if (item.to) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={clsx(className, "sidebar-menu-link")}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <span className="mr-6 grid place-items-center"></span>
                    {item.label}
                  </Link>
                );
              }

              return (
                <button key={item.label} type="button" className={className} aria-label={item.label} title={item.label}>
                  <span className="mr-6 grid place-items-center"></span>
                  {item.label}
                </button>
              );
            })}
          </nav>
      </div>
    </div>
  );
}
