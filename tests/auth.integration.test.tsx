import { act, StrictMode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { AxiosError } from "axios";
import { FirebaseError } from "firebase/app";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { Login } from "@/pages/auth/Login/login";
import { ForgetPassword } from "@/pages/auth/ForgetPassword/forget-password";
import { Profile } from "@/pages/profile/profile";
import { change, cleanup, click, deferred, render, submit } from "./reactDom";
import { api } from "@/lib/httpClient";

const mocks = vi.hoisted(() => ({
	auth: { currentUser: null as object | null, authStateReady: vi.fn(async () => {}) },
	signInWithEmail: vi.fn(),
	signInWithBackend: vi.fn(),
	logout: vi.fn(),
	resetPassword: vi.fn(),
	getMyProfile: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ auth: mocks.auth }));
vi.mock("@/lib/httpClient", () => ({ api: { defaults: { headers: { common: {} } } } }));
vi.mock("@/services/authService", () => mocks);
vi.mock("@/services/userProfileService", () => ({ getMyProfile: mocks.getMyProfile }));

const signedIn = {
	bearerToken: "token-de-teste",
	userName: "Pessoa",
	email: "pessoa@example.com",
	farmName: null,
	isFirstAccess: false,
};
const profile = {
	userId: "teste",
	name: "Pessoa",
	email: "pessoa@example.com",
	cpf: "52998224725",
	photoUrl: null,
	permissionName: "Administrador",
	permissionCode: "ADMIN",
	active: true,
	properties: [],
};

function SessionControls() {
	const { isAuthenticated } = useAuth();
	const { handleLogout, error } = useAuthActions();
	const location = useLocation();
	return (
		<>
			<output id="session">{String(isAuthenticated)}</output>
			<output id="location">{location.pathname}</output>
			<button id="logout-test" onClick={() => void handleLogout()}>
				Sair
			</button>
			{error && <p role="alert">{error}</p>}
		</>
	);
}

async function mount(path = "/login") {
	await render(
		<AuthProvider>
			<MemoryRouter initialEntries={[path]}>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/home" element={<p>Área autenticada</p>} />
					<Route path="/forget-password" element={<ForgetPassword />} />
					<Route path="/perfil" element={<Profile />} />
				</Routes>
				<SessionControls />
			</MemoryRouter>
		</AuthProvider>,
	);
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	delete api.defaults.headers.common.Authorization;
	mocks.auth.currentUser = null;
	mocks.auth.authStateReady.mockResolvedValue(undefined);
	mocks.signInWithEmail.mockResolvedValue(signedIn);
	mocks.signInWithBackend.mockResolvedValue(signedIn);
	mocks.logout.mockResolvedValue(undefined);
	mocks.resetPassword.mockResolvedValue(undefined);
	mocks.getMyProfile.mockResolvedValue(profile);
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
	});
});
afterEach(cleanup);

test("login inválido bloqueia Context e provedor, associa erros e foca o primeiro campo", async () => {
	await mount();
	await submit();
	expect(mocks.signInWithEmail).not.toHaveBeenCalled();
	expect(document.querySelector("form")!.noValidate).toBe(true);
	expect(document.activeElement?.id).toBe("login-email");
	for (const id of ["login-email", "login-password"]) {
		const input = document.getElementById(id)!;
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(
			document.getElementById(input.getAttribute("aria-describedby")!)?.getAttribute("role"),
		).toBe("alert");
	}
	await change("login-email", "pessoa@example.com");
	await submit();
	expect(document.activeElement?.id).toBe("login-password");
	expect(document.getElementById("login-email-error")).toBeNull();
	expect(mocks.signInWithEmail).not.toHaveBeenCalled();
});

test("tentativa inválida substitui o erro anterior de restauração pelos erros de campo", async () => {
	mocks.auth.currentUser = { uid: "teste" };
	mocks.signInWithBackend.mockRejectedValueOnce(new Error("rede"));
	await mount();
	expect(document.querySelector("form")?.textContent).toContain(
		"Não foi possível recuperar seu acesso",
	);
	await submit();
	expect(document.querySelector("form")?.textContent).not.toContain(
		"Não foi possível recuperar seu acesso",
	);
	expect(document.getElementById("login-email-error")?.textContent).toBe("Informe o e-mail.");
	expect(mocks.signInWithEmail).not.toHaveBeenCalled();
});

test("handlers bloqueiam e-mail excessivo e senha excessiva sem chamar autenticação", async () => {
	await mount();
	await change("login-email", `${"a".repeat(109)}@example.com`);
	await change("login-password", "senha");
	await submit();
	expect(document.getElementById("login-email-error")?.textContent).toContain("120");
	await change("login-email", "pessoa@example.com");
	await change("login-password", "a".repeat(129));
	await submit();
	expect(document.getElementById("login-password-error")?.textContent).toContain("128");
	expect(mocks.signInWithEmail).not.toHaveBeenCalled();
});

test("login válido preserva senha e preferência, apresenta loading e navega após sucesso", async () => {
	let resolve!: (value: typeof signedIn) => void;
	mocks.signInWithEmail.mockReturnValueOnce(
		new Promise((done) => {
			resolve = done;
		}),
	);
	await mount();
	await change("login-email", "PESSOA@EXAMPLE.COM");
	await change("login-password", " senha  ");
	await click(document.getElementById("remember-access")!);
	await submit();
	expect(mocks.signInWithEmail).toHaveBeenCalledWith("pessoa@example.com", " senha  ", true);
	expect(document.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
	expect(document.getElementById("location")?.textContent).toBe("/login");
	await act(async () => {
		resolve(signedIn);
	});
	expect(document.getElementById("location")?.textContent).toBe("/home");
	expect(document.getElementById("session")?.textContent).toBe("true");
});

test("conta inativa permanece sem acesso e a mensagem externa é texto; retry limpa o erro", async () => {
	const message = "Conta inativa <img src=x onerror=alert(1)>";
	mocks.signInWithEmail.mockRejectedValueOnce(
		Object.assign(new AxiosError(), { response: { status: 403, data: { message } } }),
	);
	await mount();
	await change("login-email", "pessoa@example.com");
	await change("login-password", "x");
	await submit();
	expect(document.body.textContent).toContain(message);
	expect(document.querySelector("img[src='x']")).toBeNull();
	expect(document.getElementById("session")?.textContent).toBe("false");
	expect(document.getElementById("location")?.textContent).toBe("/login");
	await submit();
	expect(document.getElementById("location")?.textContent).toBe("/home");
	expect(mocks.signInWithEmail).toHaveBeenLastCalledWith("pessoa@example.com", "x", false);
});

test.each(["", "   ", null, { detail: "técnico" }])(
	"resposta sem mensagem válida usa fallback (%j)",
	async (message) => {
		mocks.signInWithEmail.mockRejectedValueOnce(
			Object.assign(new AxiosError(), { response: { data: { message } } }),
		);
		await mount();
		await change("login-email", "pessoa@example.com");
		await change("login-password", "x");
		await submit();
		expect(document.body.textContent).toContain("Confira suas credenciais");
	},
);

test("recuperação inválida bloqueia envio e recebe foco; válida normaliza e mostra sucesso", async () => {
	await mount("/forget-password");
	await change("reset-email", "incorreto");
	await submit();
	expect(mocks.resetPassword).not.toHaveBeenCalled();
	expect(document.activeElement?.id).toBe("reset-email");
	expect(document.getElementById("reset-email")?.getAttribute("aria-describedby")).toBe(
		"reset-email-error",
	);
	expect(document.getElementById("reset-email-error")?.getAttribute("role")).toBe("alert");
	await change("reset-email", "PESSOA@EXAMPLE.COM");
	await submit();
	expect(mocks.resetPassword).toHaveBeenCalledExactlyOnceWith("pessoa@example.com");
	expect(document.body.textContent).toContain("Solicitação concluída");
});

test("falha do Firebase no login apresenta fallback sem autenticar", async () => {
	mocks.signInWithEmail.mockRejectedValueOnce(
		new FirebaseError("auth/invalid-credential", "detalhes internos"),
	);
	await mount();
	await change("login-email", "pessoa@example.com");
	await change("login-password", "x");
	await submit();
	expect(document.body.textContent).toContain("Confira suas credenciais");
	expect(document.body.textContent).not.toContain("detalhes internos");
	expect(document.getElementById("session")?.textContent).toBe("false");
});

test("recuperação com falha permite retry e não apresenta sucesso antes de resolver", async () => {
	mocks.resetPassword.mockRejectedValueOnce(new Error("rede"));
	await mount("/forget-password");
	await change("reset-email", "pessoa@example.com");
	await submit();
	expect(document.querySelector("[role=alert]")?.textContent).toContain(
		"Não foi possível enviar",
	);
	expect(document.body.textContent).not.toContain("Solicitação concluída");
	let resolve!: () => void;
	mocks.resetPassword.mockReturnValueOnce(
		new Promise<void>((done) => {
			resolve = done;
		}),
	);
	await submit();
	expect(document.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
	await act(async () => {
		resolve();
	});
	expect(document.body.textContent).toContain("Solicitação concluída");
});

test("perfil bloqueia e-mail inválido e mantém o foco no botão associado ao alerta", async () => {
	mocks.getMyProfile.mockResolvedValueOnce({ ...profile, email: "incorreto" });
	await mount("/perfil");
	const button = document.querySelector<HTMLButtonElement>(
		"[aria-label='Enviar link de redefinição de senha']",
	)!;
	button.focus();
	await click(button);
	expect(mocks.resetPassword).not.toHaveBeenCalled();
	expect(document.activeElement).toBe(button);
	expect(button.getAttribute("aria-describedby")).toBe("profile-password-error");
	expect(document.getElementById("profile-password-error")?.textContent).toBe(
		"Informe um e-mail válido.",
	);
});

test("perfil válido usa o mesmo hook de recuperação", async () => {
	mocks.getMyProfile.mockResolvedValueOnce({ ...profile, email: " PESSOA@EXAMPLE.COM " });
	await mount("/perfil");
	await click(
		document.querySelector<HTMLButtonElement>(
			"[aria-label='Enviar link de redefinição de senha']",
		)!,
	);
	expect(mocks.resetPassword).toHaveBeenCalledExactlyOnceWith("pessoa@example.com");
	expect(document.getElementById("profile-password-status")?.textContent).toContain(
		"Solicitação concluída",
	);
});

test("consulta de perfil com falha exibe feedback e permite carregar em nova tentativa", async () => {
	mocks.getMyProfile.mockRejectedValueOnce(new Error("rede"));
	await mount("/perfil");
	expect(document.body.textContent).toContain("Não foi possível carregar seu perfil");
	const retry = [...document.querySelectorAll("button")].find(
		(button) => button.textContent === "Tentar novamente",
	)!;
	await click(retry);
	expect(mocks.getMyProfile).toHaveBeenCalledTimes(2);
	expect(document.body.textContent).toContain("Dados pessoais");
	expect(document.body.textContent).not.toContain("Não foi possível carregar seu perfil");
});

test("restaura sessão via signin e logout com falha mantém acesso até uma nova tentativa", async () => {
	mocks.auth.currentUser = { uid: "teste" };
	await mount("/home");
	expect(mocks.signInWithBackend).toHaveBeenCalledExactlyOnceWith(mocks.auth.currentUser);
	expect(document.getElementById("session")?.textContent).toBe("true");
	mocks.logout.mockRejectedValueOnce(new Error("rede"));
	await click(document.getElementById("logout-test")!);
	expect(document.getElementById("location")?.textContent).toBe("/home");
	expect(document.getElementById("session")?.textContent).toBe("true");
	await click(document.getElementById("logout-test")!);
	expect(document.getElementById("location")?.textContent).toBe("/login");
	expect(document.getElementById("session")?.textContent).toBe("false");
	expect(api.defaults.headers.common.Authorization).toBeUndefined();
});

test("restauração pendente mantém o loading até o Firebase ficar pronto", async () => {
	const ready = deferred<void>();
	mocks.auth.authStateReady.mockReturnValueOnce(ready.promise);
	await mount();
	expect(document.body.textContent).toContain("Verificando acesso");
	expect(document.querySelector("form")).toBeNull();
	await act(async () => {
		ready.resolve();
	});
	expect(document.querySelector("form")).not.toBeNull();
	expect(document.getElementById("session")?.textContent).toBe("false");
});

test.each(["resolve", "reject"] as const)(
	"restauração abandonada não altera headers após %s tardio",
	async (completion) => {
		const pending = deferred<typeof signedIn>();
		mocks.auth.currentUser = { uid: "teste" };
		mocks.signInWithBackend.mockReturnValueOnce(pending.promise);
		await mount();
		await cleanup();
		api.defaults.headers.common.Authorization = "Bearer outra-sessao";
		await act(async () => {
			if (completion === "resolve") pending.resolve(signedIn);
			else pending.reject(new Error("rede"));
		});
		expect(api.defaults.headers.common.Authorization).toBe("Bearer outra-sessao");
	},
);

test("login pendente não é enviado duas vezes nem navega pela página já desmontada", async () => {
	const pending = deferred<typeof signedIn>();
	mocks.signInWithEmail.mockReturnValueOnce(pending.promise);
	await mount();
	await change("login-email", "pessoa@example.com");
	await change("login-password", "x");
	await submit();
	await submit();
	expect(mocks.signInWithEmail).toHaveBeenCalledTimes(1);
	await click(document.querySelector<HTMLAnchorElement>("a[href='/forget-password']")!);
	await act(async () => {
		pending.resolve(signedIn);
	});
	expect(document.getElementById("location")?.textContent).toBe("/forget-password");
	expect(document.getElementById("session")?.textContent).toBe("true");
});

test("Provider desmontado ignora a conclusão do login explícito", async () => {
	const pending = deferred<typeof signedIn>();
	mocks.signInWithEmail.mockReturnValueOnce(pending.promise);
	await mount();
	await change("login-email", "pessoa@example.com");
	await change("login-password", "x");
	await submit();
	await cleanup();
	await act(async () => {
		pending.resolve(signedIn);
	});
	expect(api.defaults.headers.common.Authorization).toBeUndefined();
	expect(document.body.textContent).toBe("");
});

test("recuperação pendente bloqueia reenvio e não deixa sucesso em outra montagem", async () => {
	const pending = deferred<void>();
	mocks.resetPassword.mockReturnValueOnce(pending.promise);
	await mount("/forget-password");
	await change("reset-email", "pessoa@example.com");
	await submit();
	await submit();
	expect(mocks.resetPassword).toHaveBeenCalledTimes(1);
	await cleanup();
	await mount("/forget-password");
	await act(async () => {
		pending.resolve();
	});
	expect(document.body.textContent).not.toContain("Solicitação concluída");
	expect(document.querySelector("form")?.getAttribute("aria-busy")).toBe("false");
});

test("Context em StrictMode restaura uma sessão válida sem callbacks abandonados", async () => {
	mocks.auth.currentUser = { uid: "teste" };
	await render(
		<StrictMode>
			<AuthProvider>
				<MemoryRouter>
					<SessionControls />
				</MemoryRouter>
			</AuthProvider>
		</StrictMode>,
	);
	expect(document.getElementById("session")?.textContent).toBe("true");
	expect(api.defaults.headers.common.Authorization).toBe(`Bearer ${signedIn.bearerToken}`);
	await cleanup();
});
