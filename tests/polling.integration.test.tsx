import { act, StrictMode, useEffect } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useAiUsage } from "@/hooks/useAiUsage";
import { InvalidAiUsageResponseError } from "@/services/aiUsageService";
import { cleanup, deferred, render } from "./reactDom";

const mocks = vi.hoisted(() => ({ getAiUsage: vi.fn() }));
vi.mock("@/services/aiUsageService", async (original) => ({
	...(await original<object>()),
	getAiUsage: mocks.getAiUsage,
}));

let usage: ReturnType<typeof useAiUsage>;
function Probe() {
	const result = useAiUsage();
	useEffect(() => {
		usage = result;
	}, [result]);
	return <output>{result.users.map((user) => user.name).join(",")}</output>;
}
function page(index: number, name = "Atual") {
	return {
		data: [
			{
				userId: name,
				name,
				email: null,
				photoUrl: null,
				calls: 1,
				modelCalls: 1,
				tokens: 1,
				unknownTokenCalls: 0,
				costUsd: 1,
				knownCostCalls: 1,
				unknownCostCalls: 0,
			},
		],
		page: index,
		size: 10,
		totalElements: 20,
		totalPages: 2,
		first: index === 0,
		last: index === 1,
	};
}
beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-11-02T12:00:00Z"));
	mocks.getAiUsage.mockReset();
});
afterEach(async () => {
	await cleanup();
	vi.useRealTimers();
});

test("polling aguarda a consulta e só repete 30 segundos após a conclusão", async () => {
	const pending = deferred<ReturnType<typeof page>>();
	mocks.getAiUsage.mockReturnValueOnce(pending.promise).mockResolvedValue(page(0));
	await render(<Probe />);
	expect(usage.loading).toBe(true);
	expect(usage.updatedAt).toBeNull();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(60_000);
	});
	expect(mocks.getAiUsage).toHaveBeenCalledTimes(1);
	await act(async () => {
		pending.resolve(page(0));
	});
	const updatedAt = usage.updatedAt;
	expect(usage.loading).toBe(false);
	expect(updatedAt).not.toBeNull();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(29_999);
	});
	expect(mocks.getAiUsage).toHaveBeenCalledTimes(1);
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1);
	});
	expect(mocks.getAiUsage).toHaveBeenCalledTimes(2);
	expect(usage.updatedAt!.getTime()).toBeGreaterThan(updatedAt!.getTime());
});

test("falha de atualização preserva a resposta e a data da última consulta válida", async () => {
	mocks.getAiUsage.mockResolvedValueOnce(page(0)).mockRejectedValueOnce(new Error("rede"));
	await render(<Probe />);
	const updatedAt = usage.updatedAt;
	await act(async () => {
		await vi.advanceTimersByTimeAsync(30_000);
	});
	expect(usage.users[0].name).toBe("Atual");
	expect(usage.updatedAt).toBe(updatedAt);
	expect(usage.loading).toBe(false);
	expect(usage.error).toContain("Não foi possível atualizar");
});

test("troca de página e retry ignoram resposta antiga e limpam metadados da página anterior", async () => {
	const old = deferred<ReturnType<typeof page>>();
	const current = deferred<ReturnType<typeof page>>();
	mocks.getAiUsage
		.mockResolvedValueOnce(page(0))
		.mockReturnValueOnce(old.promise)
		.mockReturnValueOnce(current.promise);
	await render(<Probe />);
	await act(async () => {
		usage.reload();
	});
	const oldSignal = mocks.getAiUsage.mock.calls[1][2] as AbortSignal;
	await act(async () => {
		usage.setPage(1);
	});
	expect(oldSignal.aborted).toBe(true);
	expect(usage.users).toEqual([]);
	expect(usage.updatedAt).toBeNull();
	expect(usage.totalElements).toBe(0);
	await act(async () => {
		current.resolve(page(1, "Página nova"));
		old.resolve(page(0, "Antiga"));
	});
	expect(usage.users[0].name).toBe("Página nova");
	await act(async () => {
		usage.setPage(1);
	});
	expect(mocks.getAiUsage).toHaveBeenCalledTimes(3);
	expect(usage.loading).toBe(false);
});

test.each(["resolve", "reject"] as const)(
	"unmount durante polling ignora %s tardio e não recria timer",
	async (completion) => {
		const pending = deferred<ReturnType<typeof page>>();
		mocks.getAiUsage.mockReturnValueOnce(pending.promise);
		await render(<Probe />);
		const signal = mocks.getAiUsage.mock.calls[0][2] as AbortSignal;
		await cleanup();
		expect(signal.aborted).toBe(true);
		await act(async () => {
			if (completion === "resolve") pending.resolve(page(0));
			else pending.reject(new Error("rede"));
		});
		expect(vi.getTimerCount()).toBe(0);
	},
);

test("StrictMode deixa apenas um ciclo ativo e remove o timer concluído no unmount", async () => {
	mocks.getAiUsage.mockResolvedValue(page(0));
	await render(
		<StrictMode>
			<Probe />
		</StrictMode>,
	);
	const signals = mocks.getAiUsage.mock.calls.map((call) => call[2] as AbortSignal);
	expect(signals.filter((signal) => !signal.aborted)).toHaveLength(1);
	expect(vi.getTimerCount()).toBe(1);
	await cleanup();
	expect(signals.every((signal) => signal.aborted)).toBe(true);
	expect(vi.getTimerCount()).toBe(0);
});

test("dados inválidos mantêm mensagem específica e retry substitui o ciclo", async () => {
	mocks.getAiUsage
		.mockRejectedValueOnce(new InvalidAiUsageResponseError())
		.mockResolvedValueOnce(page(0));
	await render(<Probe />);
	expect(usage.error).toContain("inválidos");
	expect(usage.users).toEqual([]);
	const oldSignal = mocks.getAiUsage.mock.calls[0][2] as AbortSignal;
	await act(async () => {
		usage.reload();
	});
	expect(oldSignal.aborted).toBe(true);
	expect(usage.error).toBeNull();
	expect(usage.updatedAt).not.toBeNull();
	expect(vi.getTimerCount()).toBe(1);
});
