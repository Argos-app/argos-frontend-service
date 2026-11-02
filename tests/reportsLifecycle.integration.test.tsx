import { act, StrictMode, useEffect } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { HerdReportsContent } from "@/components/HerdReportsContent";
import Sidebar from "@/components/Sidebar/SidebarComponent";
import { useHerdReportDownload } from "@/hooks/useHerdReports";
import { cleanup, click, deferred, render } from "./reactDom";

const mocks = vi.hoisted(() => ({
	getHerdReports: vi.fn(),
	exportHerdReport: vi.fn(),
	getProperties: vi.fn(),
	success: vi.fn(),
	error: vi.fn(),
}));
vi.mock("@/services/herdReportService", async (original) => ({
	...(await original<object>()),
	getHerdReports: mocks.getHerdReports,
	exportHerdReport: mocks.exportHerdReport,
}));
vi.mock("@/services/propertyService", () => ({ getProperties: mocks.getProperties }));
vi.mock("antd/es/app", () => ({
	default: { useApp: () => ({ message: { success: mocks.success, error: mocks.error } }) },
}));
vi.mock("@/context/AuthContext", () => ({
	useAuth: () => ({ profile: null, initializationError: null, signIn: vi.fn(), logout: vi.fn() }),
}));

const report = {
	id: "relatorio",
	reportType: "Histórico",
	reportCreatedAt: "2026-11-02",
	lastUpdatedAt: null,
	propertyId: "fazenda",
	propertyName: "Fazenda nova",
	herdName: "Rebanho novo",
	herdBreed: null,
};
function page(index = 0, name = "Novo") {
	return {
		data: [{ ...report, id: name, herdName: name }],
		page: index,
		size: 10,
		totalElements: 11,
		totalPages: 2,
		first: index === 0,
		last: index === 1,
	};
}
let download: ReturnType<typeof useHerdReportDownload>;
function DownloadProbe() {
	const result = useHerdReportDownload();
	useEffect(() => {
		download = result;
	}, [result]);
	return (
		<button id="download" onClick={() => void result.download(report)}>
			Baixar
		</button>
	);
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
	mocks.getProperties.mockResolvedValue({
		data: [{ id: "fazenda", name: "Fazenda nova" }],
		totalPages: 1,
		last: true,
	});
	Object.defineProperty(URL, "createObjectURL", {
		configurable: true,
		value: vi.fn(() => "blob:teste"),
	});
	Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
	vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(async () => {
	await cleanup();
	vi.useRealTimers();
	vi.restoreAllMocks();
});

test("mudar a fazenda reinicia a página, ignora relatório antigo e baixa a linha selecionada", async () => {
	const old = deferred<ReturnType<typeof page>>();
	mocks.getHerdReports
		.mockResolvedValueOnce(page())
		.mockReturnValueOnce(old.promise)
		.mockResolvedValueOnce(page(0, "Filtrado"));
	const exporting = deferred<object>();
	mocks.exportHerdReport.mockReturnValueOnce(exporting.promise);
	await render(<HerdReportsContent />);
	await click(document.querySelector<HTMLElement>("li[title='2']")!);
	expect(mocks.getHerdReports.mock.calls[1][0]).toBe(1);
	const oldSignal = mocks.getHerdReports.mock.calls[1][2] as AbortSignal;
	await act(async () => {
		document
			.getElementById("herd-reports-property")!
			.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
	});
	const option = [...document.querySelectorAll<HTMLElement>(".ant-select-item-option")].find(
		(item) => item.textContent === "Fazenda nova",
	)!;
	expect(option).toBeDefined();
	await click(option);
	expect(oldSignal.aborted).toBe(true);
	expect(mocks.getHerdReports.mock.calls.at(-1)![0]).toBe(0);
	expect(mocks.getHerdReports.mock.calls.at(-1)![3]).toBe("fazenda");
	await act(async () => {
		old.resolve(page(1, "Antigo"));
	});
	expect(document.querySelector("table")?.textContent).toContain("Filtrado");
	expect(document.querySelector("table")?.textContent).not.toContain("Antigo");
	await click(document.querySelector<HTMLButtonElement>("button[aria-label^='Baixar XLSX']")!);
	expect(mocks.exportHerdReport.mock.calls[0][0]).toBe("Filtrado");
	await cleanup();
	await act(async () => {
		exporting.resolve({ blob: new Blob(["teste"]), filename: "teste.xlsx" });
	});
	expect(URL.createObjectURL).not.toHaveBeenCalled();
});

test("download bloqueia segunda ação, preserva nome e libera object URL após iniciar", async () => {
	vi.useFakeTimers();
	const pending = deferred<object>();
	mocks.exportHerdReport.mockReturnValueOnce(pending.promise);
	await render(<DownloadProbe />);
	await click(document.getElementById("download")!);
	await click(document.getElementById("download")!);
	expect(mocks.exportHerdReport).toHaveBeenCalledTimes(1);
	expect(download.downloadingReportId).toBe(report.id);
	let filename = "";
	vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
		this: HTMLAnchorElement,
	) {
		filename = this.download;
	});
	await act(async () => {
		pending.resolve({ blob: new Blob(["teste"]), filename: "rebanho.xlsx" });
	});
	expect(filename).toBe("rebanho.xlsx");
	expect(download.downloadingReportId).toBeNull();
	expect(mocks.success).toHaveBeenCalledExactlyOnceWith("Download iniciado.");
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1000);
	});
	expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:teste");
});

test.each(["resolve", "reject"] as const)(
	"exportação abandonada ignora %s sem mensagem ou download",
	async (completion) => {
		const pending = deferred<object>();
		mocks.exportHerdReport.mockReturnValueOnce(pending.promise);
		await render(<DownloadProbe />);
		await click(document.getElementById("download")!);
		const signal = mocks.exportHerdReport.mock.calls[0][1] as AbortSignal;
		await cleanup();
		expect(signal.aborted).toBe(true);
		await act(async () => {
			if (completion === "resolve")
				pending.resolve({ blob: new Blob(["teste"]), filename: "teste.xlsx" });
			else pending.reject(new Error("rede"));
		});
		expect(URL.createObjectURL).not.toHaveBeenCalled();
		expect(mocks.success).not.toHaveBeenCalled();
		expect(mocks.error).not.toHaveBeenCalled();
	},
);

test("falha de download encerra a fase e permite uma nova tentativa", async () => {
	vi.useFakeTimers();
	mocks.exportHerdReport
		.mockRejectedValueOnce(new Error("rede"))
		.mockResolvedValueOnce({ blob: new Blob(["teste"]), filename: "teste.xlsx" });
	await render(<DownloadProbe />);
	await click(document.getElementById("download")!);
	expect(download.downloadingReportId).toBeNull();
	expect(download.error?.message).toContain("Não foi possível baixar");
	await click(document.getElementById("download")!);
	expect(download.error).toBeNull();
	expect(mocks.exportHerdReport).toHaveBeenCalledTimes(2);
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1000);
	});
});

test("listener da sidebar em StrictMode mantém somente a inscrição ativa e remove no unmount", async () => {
	const listeners = new Set<EventListener>();
	const media = {
		matches: false,
		addEventListener: (_name: string, listener: EventListener) => listeners.add(listener),
		removeEventListener: (_name: string, listener: EventListener) => listeners.delete(listener),
	};
	Object.defineProperty(window, "matchMedia", { configurable: true, value: () => media });
	await render(
		<StrictMode>
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>
		</StrictMode>,
	);
	expect(listeners.size).toBe(1);
	expect(document.querySelector("[aria-label='Recolher menu lateral']")).not.toBeNull();
	await act(async () => {
		media.matches = true;
		for (const listener of listeners) listener(new Event("change"));
	});
	expect(document.querySelector("[aria-label='Expandir menu lateral']")).not.toBeNull();
	await cleanup();
	expect(listeners.size).toBe(0);
});
