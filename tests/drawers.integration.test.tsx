import { act, useEffect } from "react";
import { App } from "antd";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CreateUserDrawer } from "@/components/CreateUserDrawer";
import { EditUserDrawer } from "@/components/EditUserDrawer";
import { EditAccessDrawer } from "@/components/EditAccessDrawer";
import { PropertyFormDrawer } from "@/components/PropertyFormDrawer";
import { DeleteButton } from "@/components/DeleteButton";
import { ToggleUserStatusButton } from "@/components/Table/ToggleUserStatusButton";
import { change, cleanup, click, deferred, render, rerender, submit } from "./reactDom";

const mocks = vi.hoisted(() => ({
	createUser: vi.fn(),
	updateUser: vi.fn(),
	getUserCreationOptions: vi.fn(),
	getPermissionOptions: vi.fn(),
	updateUserAccess: vi.fn(),
	getAdministrators: vi.fn(),
	updateProperty: vi.fn(),
}));
vi.mock("@/services/userService", () => ({ ...mocks, deleteUser: vi.fn() }));
vi.mock("@/services/userAccessService", () => ({ ...mocks, updateUserStatus: vi.fn() }));
vi.mock("@/services/propertyService", () => ({
	...mocks,
	createProperty: vi.fn(),
	deactivateProperty: vi.fn(),
}));

let notifications: ReturnType<typeof App.useApp>["message"];
function Messages() {
	const { message } = App.useApp();
	useEffect(() => {
		notifications = message;
	}, [message]);
	return null;
}
const id = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const user = {
	userId: id,
	name: "Pessoa A",
	email: "pessoa@example.com",
	cpf: "52998224725",
	photoUrl: "",
	active: true,
	permissionId: id,
	properties: [{ id, name: "Fazenda", cnpj: null, linkDate: "2026-01-01" }],
};
const access = { ...user, permissionName: "Atual" };
const property = {
	id,
	name: "Fazenda A",
	cnpj: null,
	address: "Rua",
	city: "Cidade",
	state: "SP",
	areaHectares: null,
	phone: null,
	active: true,
	responsibleAdminId: id,
	responsibleAdminName: "Admin",
};

function field(name: string) {
	return document.querySelector<HTMLInputElement>(`form [id='${name}'], form [id$='_${name}']`)!;
}
async function select(name: string, label: string) {
	await act(async () => {
		field(name).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
	});
	const item = [...document.querySelectorAll<HTMLElement>(".ant-select-item-option")].find(
		(item) => item.textContent === label,
	)!;
	expect(item).toBeDefined();
	await click(item);
}
function button(text: string) {
	return [...document.querySelectorAll<HTMLButtonElement>("button")].find(
		(item) => item.textContent?.replace(/\s/g, "") === text.replace(/\s/g, ""),
	)!;
}
beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	vi.resetAllMocks();
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: () => ({
			matches: false,
			addListener() {},
			removeListener() {},
			addEventListener() {},
			removeEventListener() {},
		}),
	});
	const computed = window.getComputedStyle;
	vi.spyOn(window, "getComputedStyle").mockImplementation((element) => computed(element));
	mocks.getUserCreationOptions.mockResolvedValue({
		properties: [{ id, name: "Fazenda" }],
		permissions: [{ id, name: "Atual" }],
	});
	mocks.getPermissionOptions.mockResolvedValue([
		{ id, name: "Atual" },
		{ id: other, name: "Nova" },
	]);
	mocks.getAdministrators.mockResolvedValue({
		data: [{ id, name: "Admin", email: "admin@example.com" }],
		last: true,
		totalPages: 1,
	});
	mocks.createUser.mockResolvedValue(undefined);
	mocks.updateUser.mockResolvedValue(undefined);
	mocks.updateUserAccess.mockResolvedValue(undefined);
	mocks.updateProperty.mockResolvedValue(undefined);
});
afterEach(async () => {
	await cleanup();
	vi.restoreAllMocks();
});

test.each(["usuário", "propriedade"] as const)(
	"trocar %s limpa valores e erros do registro anterior",
	async (kind) => {
		const onClose = vi.fn();
		const onUpdated = vi.fn();
		const drawer = (next = false) =>
			kind === "usuário" ? (
				<EditUserDrawer
					user={{
						...user,
						userId: next ? other : id,
						name: next ? "Pessoa B" : user.name,
					}}
					open
					onClose={onClose}
					onUpdated={onUpdated}
				/>
			) : (
				<PropertyFormDrawer
					property={{
						...property,
						id: next ? other : id,
						name: next ? "Fazenda B" : property.name,
					}}
					open
					onClose={onClose}
					onSaved={onUpdated}
				/>
			);
		await render(
			<App>
				<Messages />
				{drawer()}
			</App>,
		);
		await change(field("name").id, " ");
		await submit();
		expect(document.querySelector(".ant-form-item-explain-error")).not.toBeNull();
		await rerender(
			<App>
				<Messages />
				{drawer(true)}
			</App>,
		);
		expect(field("name").value).toBe(kind === "usuário" ? "Pessoa B" : "Fazenda B");
		expect(document.querySelector(".ant-form-item-explain-error")).toBeNull();
	},
);

test("drawer não fecha durante envio; falha conserva valores e permite retry", async () => {
	const pending = deferred<void>();
	mocks.updateUser.mockReturnValueOnce(pending.promise);
	const onClose = vi.fn();
	const onUpdated = vi.fn();
	await render(
		<App>
			<Messages />
			<EditUserDrawer user={user} open onClose={onClose} onUpdated={onUpdated} />
		</App>,
	);
	const failure = vi.spyOn(notifications, "error").mockImplementation(() => undefined!);
	const success = vi.spyOn(notifications, "success").mockImplementation(() => undefined!);
	await change(field("name").id, "Nome digitado");
	await submit();
	expect(mocks.updateUser).toHaveBeenCalledTimes(1);
	await click(button("Cancelar"));
	const close = document.querySelector<HTMLButtonElement>(".ant-drawer-close")!;
	await click(close);
	expect(onClose).not.toHaveBeenCalled();
	await act(async () => {
		pending.reject(new Error("rede"));
	});
	expect(failure).toHaveBeenCalledTimes(1);
	expect(field("name").value).toBe("Nome digitado");
	await submit();
	expect(onUpdated).toHaveBeenCalledTimes(1);
	expect(success).toHaveBeenCalledTimes(1);
});

test.each([
	["criação", "resolve"],
	["criação", "reject"],
	["edição", "resolve"],
	["edição", "reject"],
	["permissão", "resolve"],
	["permissão", "reject"],
	["propriedade", "resolve"],
	["propriedade", "reject"],
] as const)("%s abandonada ignora %s sem mensagens ou callbacks", async (kind, completion) => {
	const pending = deferred<void>();
	const onClose = vi.fn();
	const onDone = vi.fn();
	const operation =
		kind === "criação"
			? mocks.createUser
			: kind === "edição"
				? mocks.updateUser
				: kind === "permissão"
					? mocks.updateUserAccess
					: mocks.updateProperty;
	operation.mockReturnValueOnce(pending.promise);
	const drawer =
		kind === "criação" ? (
			<CreateUserDrawer open onClose={onClose} onCreated={onDone} />
		) : kind === "edição" ? (
			<EditUserDrawer user={user} open onClose={onClose} onUpdated={onDone} />
		) : kind === "permissão" ? (
			<EditAccessDrawer user={access} open onClose={onClose} onUpdated={onDone} />
		) : (
			<PropertyFormDrawer property={property} open onClose={onClose} onSaved={onDone} />
		);
	await render(
		<App>
			<Messages />
			{drawer}
		</App>,
	);
	const success = vi.spyOn(notifications, "success").mockImplementation(() => undefined!);
	const failure = vi.spyOn(notifications, "error").mockImplementation(() => undefined!);
	if (kind === "criação") {
		await change(field("name").id, "Pessoa");
		await change(field("email").id, "pessoa@example.com");
		await change(field("cpf").id, "52998224725");
		await change(field("password").id, "senha123");
		await select("propertyId", "Fazenda");
		await select("permissionId", "Atual");
	}
	if (kind === "permissão") await select("permissionId", "Nova");
	await submit();
	expect(operation).toHaveBeenCalledTimes(1);
	await cleanup();
	await act(async () => {
		if (completion === "resolve") pending.resolve();
		else pending.reject(new Error("rede"));
	});
	expect(onDone).not.toHaveBeenCalled();
	expect(success).not.toHaveBeenCalled();
	expect(failure).not.toHaveBeenCalled();
});

test("mutação do registro anterior não fecha ou limpa o novo registro de edição", async () => {
	const pending = deferred<void>();
	mocks.updateUser.mockReturnValueOnce(pending.promise);
	const onClose = vi.fn();
	const onUpdated = vi.fn();
	await render(
		<App>
			<Messages />
			<EditUserDrawer user={user} open onClose={onClose} onUpdated={onUpdated} />
		</App>,
	);
	const success = vi.spyOn(notifications, "success").mockImplementation(() => undefined!);
	await submit();
	await rerender(
		<App>
			<Messages />
			<EditUserDrawer
				user={{ ...user, userId: other, name: "Pessoa B" }}
				open
				onClose={onClose}
				onUpdated={onUpdated}
			/>
		</App>,
	);
	await act(async () => {
		pending.resolve();
	});
	expect(field("name").value).toBe("Pessoa B");
	expect(onUpdated).not.toHaveBeenCalled();
	expect(success).not.toHaveBeenCalled();
});

test("confirmação conserva abertura e erro após falha e fecha somente após sucesso", async () => {
	const pending = deferred<void>();
	const confirm = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(undefined);
	await render(
		<App>
			<Messages />
			<DeleteButton
				title="Excluir"
				description="Confirmar operação"
				confirmText="Confirmar"
				cancelText="Cancelar"
				errorMessage="Falha controlada"
				onConfirm={confirm}
			>
				<button id="delete">Excluir registro</button>
			</DeleteButton>
		</App>,
	);
	vi.spyOn(notifications, "error").mockImplementation(() => undefined!);
	const success = vi.spyOn(notifications, "success").mockImplementation(() => undefined!);
	await click(document.getElementById("delete")!);
	await click(button("Confirmar"));
	await click(button("Cancelar"));
	expect(confirm).toHaveBeenCalledTimes(1);
	expect(document.body.textContent).toContain("Processando...");
	await act(async () => {
		pending.reject(new Error("rede"));
	});
	expect(document.querySelector("[role=alert]")?.textContent).toContain("Falha controlada");
	await click(button("Confirmar"));
	expect(success).toHaveBeenCalledTimes(1);
	expect(document.body.textContent).not.toContain("Falha controlada");
});

test.each([
	["confirmação", "resolve"],
	["confirmação", "reject"],
	["status", "resolve"],
	["status", "reject"],
] as const)("%s desmontada ignora %s tardio", async (kind, completion) => {
	const pending = deferred<void>();
	const operation = vi.fn(() => pending.promise);
	await render(
		<App>
			<Messages />
			{kind === "confirmação" ? (
				<DeleteButton
					title="Excluir"
					description="Confirmar"
					confirmText="Confirmar"
					cancelText="Cancelar"
					errorMessage="Falha"
					onConfirm={operation}
				>
					<button id="delete">Excluir registro</button>
				</DeleteButton>
			) : (
				<ToggleUserStatusButton user={access} onToggle={operation} />
			)}
		</App>,
	);
	const success = vi.spyOn(notifications, "success").mockImplementation(() => undefined!);
	const failure = vi.spyOn(notifications, "error").mockImplementation(() => undefined!);
	if (kind === "confirmação") {
		await click(document.getElementById("delete")!);
		await click(button("Confirmar"));
	} else await click(document.querySelector<HTMLButtonElement>("[role=switch]")!);
	await cleanup();
	await act(async () => {
		if (completion === "resolve") pending.resolve();
		else pending.reject(new Error("rede"));
	});
	expect(success).not.toHaveBeenCalled();
	expect(failure).not.toHaveBeenCalled();
});
