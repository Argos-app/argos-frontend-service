import { act, StrictMode, useEffect } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUsers } from "@/hooks/useUsers";
import { useUserAccesses } from "@/hooks/useUserAccesses";
import { useProperties } from "@/hooks/useProperties";
import { usePermissionOptions, useUserCreationOptions } from "@/hooks/useUserManagement";
import { usePropertyAdministrators } from "@/hooks/usePropertyManagement";
import { cleanup, deferred, render, rerender } from "./reactDom";

const mocks = vi.hoisted(() => ({
	getUsers: vi.fn(),
	deleteUser: vi.fn(),
	getUserAccesses: vi.fn(),
	getProperties: vi.fn(),
	deactivateProperty: vi.fn(),
	getMyProfile: vi.fn(),
	getUserCreationOptions: vi.fn(),
	getPermissionOptions: vi.fn(),
	getAdministrators: vi.fn(),
}));
vi.mock("@/services/userService", () => ({ ...mocks, createUser: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/services/userAccessService", () => ({
	...mocks,
	updateUserAccess: vi.fn(),
	updateUserStatus: vi.fn(),
}));
vi.mock("@/services/propertyService", () => ({
	...mocks,
	createProperty: vi.fn(),
	updateProperty: vi.fn(),
}));
vi.mock("@/services/userProfileService", () => mocks);

function response(page = 0, size = 10, id = "Atual") {
	return {
		data: [{ id }],
		page,
		size,
		totalElements: 20,
		totalPages: 2,
		first: page === 0,
		last: page === 1,
	};
}
type Loader = (
	page: number,
	size: number,
	signal: AbortSignal,
) => Promise<ReturnType<typeof response>>;
let resource: ReturnType<typeof usePaginatedResource<{ id: string }>>;
interface ResourceProbeProps {
	loader: Loader;
}
function ResourceProbe({ loader }: ResourceProbeProps) {
	const result = usePaginatedResource(loader, "Erro de consulta");
	useEffect(() => {
		resource = result;
	}, [result]);
	return <output>{result.data.map((row) => row.id).join(",")}</output>;
}

let profile: ReturnType<typeof useUserProfile>;
function ProfileProbe() {
	const result = useUserProfile();
	useEffect(() => {
		profile = result;
	}, [result]);
	return null;
}

let users: ReturnType<typeof useUsers>;
let accesses: ReturnType<typeof useUserAccesses>;
let properties: ReturnType<typeof useProperties>;
let navigate: ReturnType<typeof useNavigate>;
function Location() {
	const go = useNavigate();
	const location = useLocation();
	useEffect(() => {
		navigate = go;
	}, [go]);
	return <output id="location">{location.pathname}</output>;
}
function UsersProbe() {
	const result = useUsers();
	useEffect(() => {
		users = result;
	}, [result]);
	return null;
}
function AccessProbe() {
	const result = useUserAccesses();
	useEffect(() => {
		accesses = result;
	}, [result]);
	return null;
}
function PropertiesProbe() {
	const result = useProperties();
	useEffect(() => {
		properties = result;
	}, [result]);
	return null;
}
async function mountRoute(kind: "usuarios" | "acessos", suffix: string) {
	const base = `/gestao-${kind}`;
	const element = kind === "usuarios" ? <UsersProbe /> : <AccessProbe />;
	await render(
		<MemoryRouter initialEntries={[base + suffix]}>
			<Routes>
				<Route path={base} element={element} />
				<Route path={`${base}/pagina/:page`} element={element} />
				<Route path="/outra" element={<p>Outra página</p>} />
			</Routes>
			<Location />
		</MemoryRouter>,
	);
}

let options: {
	users: ReturnType<typeof useUserCreationOptions>;
	permissions: ReturnType<typeof usePermissionOptions>;
	admins: ReturnType<typeof usePropertyAdministrators>;
};
interface OptionsProbeProps {
	open: boolean;
}
function OptionsProbe({ open }: OptionsProbeProps) {
	const users = useUserCreationOptions(open);
	const permissions = usePermissionOptions(open);
	const admins = usePropertyAdministrators(open);
	useEffect(() => {
		options = { users, permissions, admins };
	}, [users, permissions, admins]);
	return null;
}

const user = {
	userId: "teste",
	name: "Pessoa",
	email: "pessoa@example.com",
	cpf: null,
	photoUrl: "",
	active: true,
	permissionId: "permissao",
	properties: [],
};
const property = {
	id: "fazenda",
	name: "Fazenda",
	cnpj: null,
	address: "Rua",
	city: "Cidade",
	state: "SP",
	areaHectares: null,
	phone: null,
	active: true,
	responsibleAdminId: "admin",
	responsibleAdminName: "Admin",
};
beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	vi.resetAllMocks();
	mocks.getUsers.mockImplementation(async (page: number, size: number) => ({
		...response(page, size),
		data: [user],
	}));
	mocks.getUserAccesses.mockImplementation(async (page: number, size: number) => ({
		...response(page, size),
		data: [],
	}));
	mocks.getProperties.mockImplementation(async (page: number, size: number) => ({
		...response(page, size),
		data: [property],
	}));
	mocks.deleteUser.mockResolvedValue(undefined);
	mocks.deactivateProperty.mockResolvedValue(undefined);
});
afterEach(cleanup);

test.each(["resolve", "reject"] as const)(
	"reducer ignora %s da página anterior mesmo com transporte que ignora abort",
	async (completion) => {
		const old = deferred<ReturnType<typeof response>>();
		const current = deferred<ReturnType<typeof response>>();
		const loader = vi
			.fn()
			.mockReturnValueOnce(old.promise)
			.mockReturnValueOnce(current.promise);
		await render(<ResourceProbe loader={loader} />);
		const signal = loader.mock.calls[0][2] as AbortSignal;
		await act(async () => {
			resource.setPage(1);
		});
		expect(signal.aborted).toBe(true);
		await act(async () => {
			current.resolve(response(1, 10, "Nova"));
		});
		await act(async () => {
			if (completion === "resolve") old.resolve(response(0, 10, "Antiga"));
			else old.reject(new Error("antigo"));
		});
		expect(resource.data).toEqual([{ id: "Nova" }]);
		expect(resource.meta?.page).toBe(1);
		expect(resource.error).toBeNull();
	},
);

test("reducer rejeita resultado de outra página enviado antes do cleanup", async () => {
	const old = deferred<ReturnType<typeof response>>();
	const current = deferred<ReturnType<typeof response>>();
	const loader = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
	await render(<ResourceProbe loader={loader} />);
	await act(async () => {
		resource.setPage(1);
		old.resolve(response());
	});
	expect(resource.data).toEqual([]);
	expect(resource.loading).toBe(true);
	await act(async () => {
		current.resolve(response(1));
	});
	expect(resource.meta?.page).toBe(1);
});

test("página/tamanho atuais são no-op; reload e mudança de tamanho substituem a consulta", async () => {
	const reload = deferred<ReturnType<typeof response>>();
	const resized = deferred<ReturnType<typeof response>>();
	const loader = vi
		.fn()
		.mockResolvedValueOnce(response())
		.mockReturnValueOnce(reload.promise)
		.mockReturnValueOnce(resized.promise);
	await render(<ResourceProbe loader={loader} />);
	await act(async () => {
		resource.setPage(0);
		resource.setSize(10);
	});
	expect(loader).toHaveBeenCalledTimes(1);
	expect(resource.loading).toBe(false);
	await act(async () => {
		resource.reload();
	});
	expect(resource.loading).toBe(true);
	await act(async () => {
		resource.setSize(20);
	});
	await act(async () => {
		reload.resolve(response(0, 10, "Antiga"));
		resized.resolve(response(0, 20, "Nova"));
	});
	expect(resource.data).toEqual([{ id: "Nova" }]);
	expect(resource.size).toBe(20);
	expect(resource.meta?.size).toBe(20);
});

test("mudança do loader e StrictMode descartam consultas abandonadas", async () => {
	const old = deferred<ReturnType<typeof response>>();
	const loader = vi.fn().mockReturnValue(old.promise);
	const replacement = vi.fn().mockResolvedValue(response(0, 10, "Substituída"));
	await render(
		<StrictMode>
			<ResourceProbe loader={loader} />
		</StrictMode>,
	);
	await rerender(
		<StrictMode>
			<ResourceProbe loader={replacement} />
		</StrictMode>,
	);
	expect(loader.mock.calls.every((call) => (call[2] as AbortSignal).aborted)).toBe(true);
	await act(async () => {
		old.resolve(response());
	});
	expect(resource.data).toEqual([{ id: "Substituída" }]);
	const signal = replacement.mock.calls.at(-1)![2] as AbortSignal;
	await cleanup();
	expect(signal.aborted).toBe(true);
});

test("perfil substitui consulta no retry e ignora falha tardia após unmount", async () => {
	const old = deferred<object>();
	const current = deferred<object>();
	const abandoned = deferred<object>();
	mocks.getMyProfile
		.mockReturnValueOnce(old.promise)
		.mockReturnValueOnce(current.promise)
		.mockReturnValueOnce(abandoned.promise);
	await render(<ProfileProbe />);
	const oldSignal = mocks.getMyProfile.mock.calls[0][0] as AbortSignal;
	await act(async () => {
		profile.reload();
	});
	expect(oldSignal.aborted).toBe(true);
	await act(async () => {
		current.resolve({ userId: "Atual" });
		old.resolve({ userId: "Antigo" });
	});
	expect(profile.profile?.userId).toBe("Atual");
	await act(async () => {
		profile.reload();
	});
	await cleanup();
	await act(async () => {
		abandoned.reject(new Error("antigo"));
	});
	expect((mocks.getMyProfile.mock.calls.at(-1)![0] as AbortSignal).aborted).toBe(true);
});

test.each(["usuarios", "acessos"] as const)(
	"rota de %s trata parâmetros e segue navegação por histórico",
	async (kind) => {
		await mountRoute(kind, "/pagina/abc");
		expect(document.getElementById("location")?.textContent).toBe(`/gestao-${kind}`);
		await act(async () => {
			navigate(`/gestao-${kind}/pagina/2`);
		});
		expect(kind === "usuarios" ? users.page : accesses.page).toBe(1);
		await act(async () => {
			navigate(-1);
		});
		expect(kind === "usuarios" ? users.page : accesses.page).toBe(0);
		await act(async () => {
			navigate(`/gestao-${kind}/pagina/0`);
		});
		expect(document.getElementById("location")?.textContent).toBe(`/gestao-${kind}`);
	},
);

test("exclusão do último usuário atualiza página e URL sem voltar à página vazia", async () => {
	await mountRoute("usuarios", "/pagina/2");
	await act(async () => {
		await users.remove(user);
	});
	expect(users.page).toBe(0);
	expect(document.getElementById("location")?.textContent).toBe("/gestao-usuarios");
	expect(mocks.getUsers.mock.calls.at(-1)![0]).toBe(0);
});

test("exclusão concluída após sair da tela não navega pela rota antiga", async () => {
	const pending = deferred<void>();
	mocks.deleteUser.mockReturnValueOnce(pending.promise);
	await mountRoute("usuarios", "/pagina/2");
	let mutation!: Promise<void>;
	await act(async () => {
		mutation = users.remove(user);
	});
	await act(async () => {
		navigate("/outra");
	});
	await act(async () => {
		pending.resolve();
		await mutation;
	});
	expect(document.getElementById("location")?.textContent).toBe("/outra");
});

test("desativação da última propriedade carrega a página anterior", async () => {
	await render(<PropertiesProbe />);
	await act(async () => {
		properties.setPage(1);
	});
	await act(async () => {
		await properties.deactivate(property);
	});
	expect(properties.page).toBe(0);
	expect(mocks.getProperties.mock.calls.at(-1)![0]).toBe(0);
});

test("exclusão iniciada em outra página não altera a página escolhida durante o envio", async () => {
	const pending = deferred<void>();
	mocks.deleteUser.mockReturnValueOnce(pending.promise);
	await mountRoute("usuarios", "/pagina/2");
	let mutation!: Promise<void>;
	await act(async () => { mutation = users.remove(user); });
	await act(async () => { navigate("/gestao-usuarios/pagina/3"); });
	await act(async () => { pending.resolve(); await mutation; });
	expect(document.getElementById("location")?.textContent).toBe("/gestao-usuarios/pagina/3");
	expect(users.page).toBe(2);
});

test.each(["resolve", "reject"] as const)(
	"opções fechadas/reabertas ignoram %s antigo e mantêm retry",
	async (completion) => {
		const oldUsers = deferred<object>();
		const newUsers = deferred<object>();
		const oldPermissions = deferred<object[]>();
		const newPermissions = deferred<object[]>();
		const oldAdmins = deferred<object>();
		const newAdmins = deferred<object>();
		mocks.getUserCreationOptions
			.mockReturnValueOnce(oldUsers.promise)
			.mockReturnValueOnce(newUsers.promise)
			.mockResolvedValue({ properties: [], permissions: [] });
		mocks.getPermissionOptions
			.mockReturnValueOnce(oldPermissions.promise)
			.mockReturnValueOnce(newPermissions.promise)
			.mockResolvedValue([]);
		mocks.getAdministrators
			.mockReturnValueOnce(oldAdmins.promise)
			.mockReturnValueOnce(newAdmins.promise)
			.mockResolvedValue({ ...response(), data: [], last: true });
		await render(<OptionsProbe open />);
		const signals = [
			mocks.getUserCreationOptions.mock.calls[0][0],
			mocks.getPermissionOptions.mock.calls[0][0],
			mocks.getAdministrators.mock.calls[0][2],
		] as AbortSignal[];
		await rerender(<OptionsProbe open={false} />);
		expect(signals.every((signal) => signal.aborted)).toBe(true);
		await rerender(<OptionsProbe open />);
		await act(async () => {
			newUsers.resolve({ properties: [{ id: "nova", name: "Nova" }], permissions: [] });
			newPermissions.resolve([{ id: "nova", name: "Nova" }]);
			newAdmins.resolve({
				...response(),
				data: [{ id: "novo", name: "Novo", email: "novo@example.com" }],
				last: true,
			});
		});
		await act(async () => {
			if (completion === "resolve") {
				oldUsers.resolve({ properties: [], permissions: [] });
				oldPermissions.resolve([]);
				oldAdmins.resolve({ ...response(), data: [], last: true });
			} else {
				oldUsers.reject(new Error("antigo"));
				oldPermissions.reject(new Error("antigo"));
				oldAdmins.reject(new Error("antigo"));
			}
		});
		expect(options.users.options.properties[0].id).toBe("nova");
		expect(options.permissions.options[0].id).toBe("nova");
		expect(options.admins.administrators[0].id).toBe("novo");
		expect(options.users.error || options.permissions.error || options.admins.error).toBe(
			false,
		);
		await act(async () => {
			options.users.retry();
			options.permissions.retry();
			options.admins.retry();
		});
		expect(mocks.getUserCreationOptions).toHaveBeenCalledTimes(3);
		expect(mocks.getPermissionOptions).toHaveBeenCalledTimes(3);
		expect(mocks.getAdministrators).toHaveBeenCalledTimes(3);
	},
);
