import clsx from "clsx";

export const menuItemClass = (collapsed: boolean) =>
  clsx(
    "flex w-full items-center rounded-lg text-left text-brand-forest transition-colors hover:bg-brand-sand/50 hover:text-brand-ink focus:bg-brand-sand/50 focus:text-brand-ink focus:outline-none",
    collapsed ? "h-11 justify-center" : "p-3 text-base font-normal leading-tight active:bg-brand-sand/50 active:text-brand-ink",
  );

