import { useCallback, useEffect, useState } from "react";
import { getAiUsage, InvalidAiUsageResponseError } from "@/services/aiUsageService";
import type { AiUsageUser, PageResponse } from "@/types";

const REFRESH_INTERVAL_MS = 30_000;
const PAGE_SIZE = 10;

interface AiUsageState {
	page: number;
	attempt: number;
	response: PageResponse<AiUsageUser> | null;
	updatedAt: Date | null;
	status: "loading" | "success" | "error";
	error: string | null;
}

export function useAiUsage() {
	const [state, setState] = useState<AiUsageState>({ page: 0, attempt: 0, response: null, updatedAt: null, status: "loading", error: null });
	const { page, attempt } = state;
	const reload = useCallback(() => setState((current) => ({ ...current, attempt: current.attempt + 1, status: "loading", error: null })), []);
	const setPage = useCallback((nextPage: number) => setState((current) => current.page === nextPage ? current : {
		...current, page: nextPage, response: null, updatedAt: null, status: "loading", error: null,
	}), []);

	useEffect(() => {
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;

		async function load() {
			setState((current) => current.page === page && current.attempt === attempt ? { ...current, status: "loading" } : current);
			try {
				const result = await getAiUsage(page, PAGE_SIZE, controller.signal);
				if (!controller.signal.aborted) {
					setState((current) => current.page === page && current.attempt === attempt ? {
						...current, response: result, updatedAt: new Date(), status: "success", error: null,
					} : current);
				}
			} catch (cause) {
				if (!controller.signal.aborted) setState((current) => current.page === page && current.attempt === attempt ? {
					...current, status: "error", error: cause instanceof InvalidAiUsageResponseError ? cause.message : "Não foi possível atualizar o uso de IA. Tente novamente.",
				} : current);
			} finally {
				if (!controller.signal.aborted) {
					timer = setTimeout(load, REFRESH_INTERVAL_MS);
				}
			}
		}

		void load();
		return () => {
			controller.abort();
			if (timer) clearTimeout(timer);
		};
	}, [attempt, page]);

	const response = state.response?.page === page ? state.response : null;
	return {
		users: response?.data ?? [],
		page,
		size: PAGE_SIZE,
		totalElements: response?.totalElements ?? 0,
		totalPages: response?.totalPages ?? 0,
		loading: state.status === "loading",
		error: state.error,
		updatedAt: response ? state.updatedAt : null,
		reload,
		setPage,
	};
}
