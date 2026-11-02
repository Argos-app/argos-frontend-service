// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { AxiosError, CanceledError } from "axios";
import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { logout, resetPassword, signInWithBackend, signInWithEmail } from "@/services/authService";
import { getMyProfile } from "@/services/userProfileService";

const mocks = vi.hoisted(() => ({
	auth: {},
	getIdToken: vi.fn(),
	post: vi.fn(),
	get: vi.fn(),
	setPersistence: vi.fn(),
	signInWithEmailAndPassword: vi.fn(),
	signOut: vi.fn(),
	sendPasswordResetEmail: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ auth: mocks.auth }));
vi.mock("@/lib/httpClient", () => ({ api: { post: mocks.post, get: mocks.get } }));
vi.mock("firebase/auth", () => ({
	...mocks,
	browserLocalPersistence: "local",
	browserSessionPersistence: "session",
}));

const user = { getIdToken: mocks.getIdToken } as unknown as User;
const signedIn = { bearerToken: "token-api" };
beforeEach(() => {
	vi.resetAllMocks();
	mocks.setPersistence.mockResolvedValue(undefined);
	mocks.signInWithEmailAndPassword.mockResolvedValue({ user });
	mocks.getIdToken.mockResolvedValue("token-firebase");
	mocks.post.mockResolvedValue({ data: signedIn });
	mocks.get.mockResolvedValue({ data: { userId: "teste" } });
	mocks.signOut.mockResolvedValue(undefined);
	mocks.sendPasswordResetEmail.mockResolvedValue(undefined);
});

test.each([true, false])(
	"signin mantém persistência, senha e contrato HTTP (rememberMe=%s)",
	async (rememberMe) => {
		expect(await signInWithEmail("pessoa@example.com", " senha  ", rememberMe)).toBe(signedIn);
		expect(mocks.setPersistence).toHaveBeenCalledWith(
			mocks.auth,
			rememberMe ? "local" : "session",
		);
		expect(mocks.setPersistence.mock.invocationCallOrder[0]).toBeLessThan(
			mocks.signInWithEmailAndPassword.mock.invocationCallOrder[0],
		);
		expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
			mocks.auth,
			"pessoa@example.com",
			" senha  ",
		);
		expect(mocks.post).toHaveBeenCalledExactlyOnceWith("/auth/signin", null, {
			headers: { Authorization: "Bearer token-firebase" },
		});
	},
);

test("restauração de sessão reutiliza signin e os serviços de logout/reset mantêm os argumentos", async () => {
	expect(await signInWithBackend(user)).toBe(signedIn);
	await logout();
	await resetPassword("pessoa@example.com");
	expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith(mocks.auth);
	expect(mocks.sendPasswordResetEmail).toHaveBeenCalledExactlyOnceWith(
		mocks.auth,
		"pessoa@example.com",
	);
});

test.each(["persistência", "firebase", "token", "backend", "logout", "reset", "perfil"])(
	"preserva a rejeição original em %s",
	async (step) => {
		const error =
			step === "backend" || step === "perfil"
				? Object.assign(new AxiosError(), {
						response: { status: 403, data: { message: "Usuário inativo" } },
					})
				: new FirebaseError("auth/user-disabled", "Conta inativa");
		let operation: () => Promise<unknown> = () =>
			signInWithEmail("pessoa@example.com", "x", false);
		if (step === "persistência") mocks.setPersistence.mockRejectedValueOnce(error);
		if (step === "firebase") mocks.signInWithEmailAndPassword.mockRejectedValueOnce(error);
		if (step === "token") mocks.getIdToken.mockRejectedValueOnce(error);
		if (step === "backend") mocks.post.mockRejectedValueOnce(error);
		if (step === "logout") {
			mocks.signOut.mockRejectedValueOnce(error);
			operation = logout;
		}
		if (step === "reset") {
			mocks.sendPasswordResetEmail.mockRejectedValueOnce(error);
			operation = () => resetPassword("pessoa@example.com");
		}
		if (step === "perfil") {
			mocks.get.mockRejectedValueOnce(error);
			operation = getMyProfile;
		}
		await expect(operation()).rejects.toBe(error);
		if (step === "persistência" || step === "firebase")
			expect(mocks.post).not.toHaveBeenCalled();
	},
);

test.each(["firebase", "backend", "logout", "reset", "perfil"])(
	"falha desconhecida em %s recebe fallback e conserva causa",
	async (step) => {
		const cause = new Error("detalhes internos");
		let operation: () => Promise<unknown> = () =>
			signInWithEmail("pessoa@example.com", "x", false);
		if (step === "firebase") mocks.signInWithEmailAndPassword.mockRejectedValueOnce(cause);
		if (step === "backend") mocks.post.mockRejectedValueOnce(cause);
		if (step === "logout") {
			mocks.signOut.mockRejectedValueOnce(cause);
			operation = logout;
		}
		if (step === "reset") {
			mocks.sendPasswordResetEmail.mockRejectedValueOnce(cause);
			operation = () => resetPassword("pessoa@example.com");
		}
		if (step === "perfil") {
			mocks.get.mockRejectedValueOnce(cause);
			operation = getMyProfile;
		}
		await expect(operation()).rejects.toMatchObject({
			cause,
			message: expect.stringMatching(/^Não foi possível/),
		});
	},
);

test("consulta do perfil encaminha signal e mantém o cancelamento reconhecível", async () => {
	const controller = new AbortController();
	const canceled = new CanceledError("cancelado");
	mocks.get.mockImplementationOnce(
		(_url, { signal }) =>
			new Promise((_resolve, reject) => {
				signal.addEventListener("abort", () => reject(canceled));
			}),
	);
	const rejection = expect(getMyProfile(controller.signal)).rejects.toBe(canceled);
	expect(mocks.get).toHaveBeenCalledExactlyOnceWith("/users/me", { signal: controller.signal });
	controller.abort();
	await rejection;
});
