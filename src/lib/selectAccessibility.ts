import type { RefSelectProps } from "antd";

export function fixSelectRequiredAria(select: RefSelectProps | null) {
  // shortcut: rc-select 14 duplica aria-required no div; remover quando a biblioteca corrigir o contêiner.
  select?.nativeElement.removeAttribute("aria-required");
}
