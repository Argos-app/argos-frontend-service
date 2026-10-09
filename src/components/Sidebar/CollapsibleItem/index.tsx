import { ChevronDownIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Link, useLocation } from "react-router";
import type { SidebarMenuItem } from "@/types/sidebar.type";
import { menuItemClass } from "@/components/Sidebar/menuItemClass";

interface CollapsibleItemProps {
  label: string;
  icon: ReactNode;
  items: SidebarMenuItem[];
  collapsed: boolean;
}

export function CollapsibleItem({ label, icon, items, collapsed }: CollapsibleItemProps) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const submenuId = useId();

  return (
    <div className="relative block w-full">
      <button type="button" onClick={() => !collapsed && setOpen((current) => !current)} aria-expanded={collapsed ? undefined : open} aria-controls={collapsed ? undefined : submenuId} className={clsx(menuItemClass(collapsed), !collapsed && "justify-between")} aria-label={collapsed ? label : undefined}>
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
          <nav aria-label={label} className="flex min-w-60 flex-col gap-1">
            {items.map((item) => {
              const isActive = Boolean(item.to) && (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
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
                  >
                    <span className="mr-6 grid place-items-center"></span>
                    {item.label}
                  </Link>
                );
              }

              return (
                <button key={item.label} type="button" className={className}>
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
