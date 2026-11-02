import { act, StrictMode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Sidebar from "@/components/Sidebar/SidebarComponent";
import { INTERFACE_PREFERENCES_KEY } from "@/lib/interfacePreferences";
import { cleanup, click, render } from "./reactDom";

vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ initializationError: null, signIn: vi.fn(), logout: vi.fn() }) }));

const listeners = new Set<EventListener>();
const media = {
  matches: false,
  addEventListener: (_event: string, listener: EventListener) => listeners.add(listener),
  removeEventListener: (_event: string, listener: EventListener) => listeners.delete(listener),
};
function toggle() {
  return document.querySelector<HTMLButtonElement>("button[aria-label='Expandir menu lateral'], button[aria-label='Recolher menu lateral']")!;
}
async function mount(strict = false) {
  const content = <MemoryRouter><Sidebar /></MemoryRouter>;
  await render(strict ? <StrictMode>{content}</StrictMode> : content);
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  listeners.clear();
  media.matches = false;
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => media });
});
afterEach(async () => { await cleanup(); vi.restoreAllMocks(); });

test.each([false, true])("sem preferência usa o padrão da viewport (pequena=%s)", async (small) => {
  media.matches = small;
  await mount();
  expect(toggle().getAttribute("aria-label")).toBe(small ? "Expandir menu lateral" : "Recolher menu lateral");
  expect(localStorage.getItem(INTERFACE_PREFERENCES_KEY)).toBeNull();
});

test.each([false, true])("preferência válida %s tem precedência inicial sobre a viewport oposta", async (collapsed) => {
  media.matches = !collapsed;
  localStorage.setItem(INTERFACE_PREFERENCES_KEY, JSON.stringify({ _versao: 1, sidebarRecolhida: collapsed }));
  const write = vi.spyOn(Storage.prototype, "setItem");
  await mount();
  expect(toggle().getAttribute("aria-label")).toBe(collapsed ? "Expandir menu lateral" : "Recolher menu lateral");
  expect(write).not.toHaveBeenCalled();
});

test("mudança manual persiste ambos os valores e a remontagem restaura a preferência", async () => {
  media.matches = true;
  localStorage.setItem("firebase:authUser:teste", "sessao-simulada");
  await mount();
  toggle().focus();
  await click(toggle());
  expect(document.activeElement).toBe(toggle());
  expect(toggle().getAttribute("aria-label")).toBe("Recolher menu lateral");
  expect(JSON.parse(localStorage.getItem(INTERFACE_PREFERENCES_KEY)!)).toEqual({ _versao: 1, sidebarRecolhida: false });
  await cleanup();
  await mount();
  expect(toggle().getAttribute("aria-label")).toBe("Recolher menu lateral");
  await click(toggle());
  expect(JSON.parse(localStorage.getItem(INTERFACE_PREFERENCES_KEY)!)).toEqual({ _versao: 1, sidebarRecolhida: true });
  await cleanup();
  media.matches = false;
  await mount();
  expect(toggle().getAttribute("aria-label")).toBe("Expandir menu lateral");
  expect(localStorage.getItem("firebase:authUser:teste")).toBe("sessao-simulada");
});

test("mudança automática de viewport não grava por cima da preferência manual", async () => {
  const saved = JSON.stringify({ _versao: 1, sidebarRecolhida: false });
  localStorage.setItem(INTERFACE_PREFERENCES_KEY, saved);
  const write = vi.spyOn(Storage.prototype, "setItem");
  await mount();
  await act(async () => { media.matches = true; for (const listener of listeners) listener(new Event("change")); });
  expect(toggle().getAttribute("aria-label")).toBe("Expandir menu lateral");
  expect(localStorage.getItem(INTERFACE_PREFERENCES_KEY)).toBe(saved);
  expect(write).not.toHaveBeenCalled();
  await cleanup();
  await mount();
  expect(toggle().getAttribute("aria-label")).toBe("Recolher menu lateral");
});

test("versão incompatível é descartada isoladamente e a próxima escolha grava versão 1", async () => {
  localStorage.setItem(INTERFACE_PREFERENCES_KEY, JSON.stringify({ _versao: 2, sidebarRecolhida: true }));
  localStorage.setItem("outra-chave", "preservar");
  await mount();
  expect(toggle().getAttribute("aria-label")).toBe("Recolher menu lateral");
  expect(localStorage.getItem(INTERFACE_PREFERENCES_KEY)).toBeNull();
  expect(localStorage.getItem("outra-chave")).toBe("preservar");
  await click(toggle());
  expect(JSON.parse(localStorage.getItem(INTERFACE_PREFERENCES_KEY)!)).toEqual({ _versao: 1, sidebarRecolhida: true });
});

test.each(["getItem", "setItem", "removeItem"] as const)("sidebar continua utilizável quando %s falha", async (method) => {
  if (method === "removeItem") localStorage.setItem(INTERFACE_PREFERENCES_KEY, "{corrompido");
  vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error("storage indisponível"); });
  await mount();
  expect(toggle().getAttribute("aria-label")).toBe("Recolher menu lateral");
  await click(toggle());
  expect(toggle().getAttribute("aria-label")).toBe("Expandir menu lateral");
  expect(document.querySelector("nav[aria-label='Navegação principal']")).not.toBeNull();
  expect(document.querySelector("[role=alert]")).toBeNull();
});

test("StrictMode não grava na inicialização e um clique salva uma vez", async () => {
  const write = vi.spyOn(Storage.prototype, "setItem");
  await mount(true);
  expect(write).not.toHaveBeenCalled();
  expect(listeners.size).toBe(1);
  await click(toggle());
  expect(write).toHaveBeenCalledExactlyOnceWith(INTERFACE_PREFERENCES_KEY, JSON.stringify({ _versao: 1, sidebarRecolhida: true }));
  await cleanup();
  expect(listeners.size).toBe(0);
});
