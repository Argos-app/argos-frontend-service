import { act, useState, type ReactNode } from "react";
import { App, ConfigProvider } from "antd";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import axe from "axe-core";
import { DataTable } from "@/components/Table/DataTable";
import { UserFarmsCell } from "@/components/Table/UserFarmsCell";
import { DeleteButton } from "@/components/DeleteButton";
import { AiUsageDetailsDrawer } from "@/components/AiUsageDetailsDrawer";
import { AiUsagePanel } from "@/components/Table/AiUsagePanel";
import { CreateUserDrawer } from "@/components/CreateUserDrawer";
import { ToggleUserStatusButton } from "@/components/Table/ToggleUserStatusButton";
import { Login } from "@/pages/auth/Login/login";
import { ForgetPassword } from "@/pages/auth/ForgetPassword/forget-password";
import { Profile } from "@/pages/profile/profile";
import { HerdReports } from "@/pages/herdReports";
import { cleanup, click, deferred, render, submit } from "./reactDom";

const mocks = vi.hoisted(() => ({
  auth: { handleSignIn: vi.fn(), handleLogout: vi.fn(), loading: false, error: "Falha de autenticação", fieldErrors: {} },
  reset: { submit: vi.fn(), loading: false, error: "Falha no envio", sent: false, fieldErrors: {} },
  profile: { profile: null, loading: false, error: "Falha ao consultar perfil", reload: vi.fn() },
}));
vi.mock("@/lib/firebase", () => ({ auth: {} }));
vi.mock("@/hooks/useAuthActions", () => ({ useAuthActions: () => mocks.auth }));
vi.mock("@/hooks/usePasswordReset", () => ({ usePasswordReset: () => mocks.reset }));
vi.mock("@/hooks/useUserProfile", () => ({ useUserProfile: () => mocks.profile }));
vi.mock("@/hooks/useUserManagement", () => ({
  useUserCreationOptions: () => ({ options: { properties: [{ id: "farm", name: "Fazenda" }], permissions: [{ id: "employee", name: "Funcionário" }] }, loading: false, error: false, retry: vi.fn() }),
  useUserMutations: () => ({ pending: false, create: vi.fn() }),
}));

const user = {
  userId: "teste", name: "Pessoa de teste", email: "pessoa@example.test", photoUrl: "",
  cpf: null, active: true, permissionId: "admin",
  properties: [1, 2, 3, 4].map((id) => ({ id: String(id), name: `Fazenda ${id}`, cnpj: null, linkDate: "2026-01-01" })),
};

function Wrapper({ children }: { children: ReactNode }) {
  return <ConfigProvider theme={{ token: { motion: false } }}><App><MemoryRouter>{children}</MemoryRouter></App></ConfigProvider>;
}

async function scan() {
  const results = await act(async () => axe.run(document.body, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    // shortcut: jsdom não calcula contraste/layout, conferir cores e viewport no navegador na etapa 6.
    rules: { "color-contrast": { enabled: false } },
  }));
  expect(results.violations.map(({ id, nodes }) => ({ id, elements: nodes.map(({ html }) => html) }))).toEqual([]);
  for (const element of document.querySelectorAll("[aria-controls], [aria-describedby], [aria-labelledby]")) {
    for (const attribute of ["aria-controls", "aria-describedby", "aria-labelledby"]) {
      // O Select monta a lista sob demanda; aria-controls é verificado ao expandir o combobox.
      if (attribute === "aria-controls" && element.getAttribute("role") === "combobox" && element.getAttribute("aria-expanded") === "false") continue;
      for (const id of element.getAttribute(attribute)?.split(/\s+/).filter(Boolean) ?? []) {
        expect(document.getElementById(id), `${attribute}=${id}`).not.toBeNull();
      }
    }
  }
}

async function escape(element: HTMLElement) {
  await act(async () => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true }));
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({
    matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
  }) });
  const computed = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => computed(element));
});
afterEach(async () => { await cleanup(); vi.restoreAllMocks(); });

test.each([false, true])("tabela anuncia erro, inclusive sem retry (retry=%s)", async (retry) => {
  const onRetry = vi.fn();
  await render(<Wrapper><main><DataTable columns={[{ key: "name", header: "Nome" }]} data={[] as { id: string; name: string }[]} rowKey="id" error="Falha de rede" onRetry={retry ? onRetry : undefined} scrollAreaLabel="Registros" scrollAreaTabIndex={0} /></main></Wrapper>);
  expect(document.querySelector("[role=alert]")?.textContent).toBe("Falha de rede");
  expect(document.querySelector("th")?.getAttribute("scope")).toBe("col");
  if (retry) { await click(document.querySelector("button")!); expect(onRetry).toHaveBeenCalledOnce(); }
  else expect(document.querySelector("button")).toBeNull();
  await scan();
});

test("loading preserva a semântica da célula e anuncia o estado", async () => {
  await render(<Wrapper><main><DataTable columns={[{ key: "id", header: "Código" }]} data={[] as { id: string }[]} rowKey="id" loading /></main></Wrapper>);
  expect(document.querySelector("td")?.hasAttribute("role")).toBe(false);
  expect(document.querySelector("[role=status]")?.textContent).toContain("Carregando");
  await scan();
});

test.each([Login, ForgetPassword, Profile, HerdReports])("página %s tem erros anunciados, nomes e referências ARIA válidas", async (Page) => {
  await render(<Wrapper><Page /></Wrapper>);
  expect(document.querySelector("[role=alert]")).not.toBeNull();
  await scan();
});

test("uso de IA anuncia falha e mantém retry acessível", async () => {
  const retry = vi.fn();
  await render(<Wrapper><AiUsagePanel users={[]} loading={false} error="Falha ao consultar IA" updatedAt={null} onRefresh={retry} page={0} size={10} totalPages={0} totalElements={0} onPageChange={vi.fn()} /></Wrapper>);
  expect(document.querySelector("[role=alert]")?.textContent).toBe("Falha ao consultar IA");
  await click([...document.querySelectorAll("button")].find((item) => item.textContent === "Tentar novamente")!);
  expect(retry).toHaveBeenCalledOnce();
  await scan();
});

test("fazendas expõe estado, permite foco na lista e fecha por Escape com retorno", async () => {
  await render(<Wrapper><main><UserFarmsCell user={user} /></main></Wrapper>);
  const trigger = document.querySelector<HTMLButtonElement>("button")!;
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  trigger.focus();
  await click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const list = document.getElementById(trigger.getAttribute("aria-controls")!)!;
  expect(list.querySelectorAll("li")).toHaveLength(4);
  list.focus();
  expect(document.activeElement).toBe(list);
  await scan();
  await escape(list);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
});

function Confirmation({ onConfirm }: { onConfirm: () => Promise<void> | void }) {
  return <Wrapper><main><DeleteButton title="Excluir registro" description="Confirme a exclusão do registro de teste." confirmText="Excluir" cancelText="Cancelar" errorMessage="Falha na exclusão" onConfirm={onConfirm}><button id="delete-trigger">Excluir registro de teste</button></DeleteButton></main></Wrapper>;
}

test("confirmação tem diálogo nomeado, foco interno, Escape e retorno ao acionador", async () => {
  const confirm = vi.fn();
  await render(<Confirmation onConfirm={confirm} />);
  const trigger = document.getElementById("delete-trigger")!;
  trigger.focus();
  await click(trigger);
  const dialog = document.querySelector<HTMLElement>("[role=dialog]")!;
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  await vi.waitFor(() => expect(dialog.contains(document.activeElement), document.activeElement?.outerHTML).toBe(true));
  await scan();
  await escape(dialog);
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(confirm).not.toHaveBeenCalled();
});

test("confirmação mantém erro e retry após falha; bloqueia fechamento durante envio", async () => {
  const pending = deferred<void>();
  const confirm = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(undefined);
  await render(<Confirmation onConfirm={confirm} />);
  await click(document.getElementById("delete-trigger")!);
  const confirmButton = () => document.querySelector<HTMLButtonElement>(".ant-modal .ant-btn-primary")!;
  await click(confirmButton());
  await escape(document.querySelector("[role=dialog]")!);
  expect(document.querySelector("[role=status]")?.textContent).toBe("Processando...");
  expect(document.querySelector<HTMLButtonElement>(".ant-modal .ant-btn-default")!.disabled).toBe(true);
  await act(async () => { pending.reject(new Error("rede")); });
  expect(document.querySelector("[role=alert]")?.textContent).toBe("Falha na exclusão");
  await scan();
  await click(confirmButton());
  expect(confirm).toHaveBeenCalledTimes(2);
});

test("drawer nomeado fecha por Escape e devolve o foco ao acionador", async () => {
  function Details() {
    const [open, setOpen] = useState(false);
    return <><button id="details-trigger" onClick={() => setOpen(true)}>Ver detalhes</button><AiUsageDetailsDrawer user={null} open={open} stale={false} onClose={() => setOpen(false)} /></>;
  }
  await render(<Wrapper><main><Details /></main></Wrapper>);
  const trigger = document.getElementById("details-trigger")!;
  trigger.focus();
  await click(trigger);
  const dialog = document.querySelector<HTMLElement>("[role=dialog]")!;
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  const closeButton = document.querySelector<HTMLButtonElement>(".ant-drawer-close")!;
  closeButton.focus();
  expect(document.activeElement).toBe(closeButton);
  await scan();
  await escape(closeButton);
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("cadastro permite mostrar e ocultar senha por um botão nomeado", async () => {
  await render(<Wrapper><main /><CreateUserDrawer open onClose={vi.fn()} onCreated={vi.fn()} /></Wrapper>);
  const password = document.querySelector<HTMLInputElement>("input[autocomplete=new-password]")!;
  const toggle = document.querySelector<HTMLButtonElement>("button[aria-label='Mostrar senha']")!;
  expect(toggle.type).toBe("button");
  expect(password.type).toBe("password");
  await click(toggle);
  expect(password.type).toBe("text");
  expect(toggle.getAttribute("aria-label")).toBe("Ocultar senha");
  await click(toggle);
  expect(password.type).toBe("password");
  for (const combobox of document.querySelectorAll("[role=combobox]")) {
    expect(combobox.getAttribute("aria-required")).toBe("true");
    expect(combobox.closest(".ant-select")?.hasAttribute("aria-required")).toBe(false);
    await act(async () => { combobox.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(combobox.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(combobox.getAttribute("aria-controls")!)).not.toBeNull();
    await scan();
    await escape(combobox as HTMLElement);
  }
  await scan();
});

test("atualizar status mantém foco durante refresh e impede envio duplicado", async () => {
  const pending = deferred<void>();
  const operation = vi.fn();
  function StatusTable() {
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);
    return <DataTable data={[{ ...user, active, permissionName: "Aplicador" }]} rowKey="userId" loading={loading} columns={[{ key: "status", header: "Status", render: (row) => <ToggleUserStatusButton user={row} onToggle={async (_user, nextActive) => {
      operation(nextActive);
      setLoading(true);
      await pending.promise;
      setActive(nextActive);
      setLoading(false);
    }} /> }]} />;
  }
  await render(<Wrapper><main><StatusTable /></main></Wrapper>);
  const control = document.querySelector<HTMLButtonElement>("[role=switch]")!;
  control.focus();
  await click(control);
  expect(control.getAttribute("aria-disabled")).toBe("true");
  expect(control.disabled).toBe(false);
  expect(document.activeElement).toBe(control);
  await click(control);
  expect(operation).toHaveBeenCalledExactlyOnceWith(false);
  await act(async () => { pending.resolve(); });
  expect(control.getAttribute("aria-checked")).toBe("false");
  expect(document.activeElement).toBe(control);
  await scan();
});

test("erros do formulário Ant Design são anunciados sem duplicar os campos", async () => {
  await render(<Wrapper><main /><CreateUserDrawer open onClose={vi.fn()} onCreated={vi.fn()} /></Wrapper>);
  await submit();
  const alert = document.querySelector("p[role=alert]")!;
  expect(alert.textContent).toContain("Informe o nome.");
  expect(alert.textContent).toContain("Informe o e-mail.");
  expect(document.querySelector("input[aria-invalid=true]" )?.getAttribute("aria-describedby")).toContain("_help");
  await scan();
});
