import { useCallback, useEffect, useState } from "react";
import { getAiUsage, InvalidAiUsageResponseError } from "@/services/aiUsageService";
import type { AiUsageUser, PageResponse } from "@/types";

const REFRESH_INTERVAL_MS = 30_000;
const PAGE_SIZE = 10;

export function useAiUsage() {
	const [page, setPageIndex] = useState(0);
	const [response, setResponse] = useState<PageResponse<AiUsageUser> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
	const [attempt, setAttempt] = useState(0);
	const reload = useCallback(() => setAttempt((current) => current + 1), []);
	const setPage = useCallback((nextPage: number) => {
		if (nextPage === page) return;
		setPageIndex(nextPage);
		setLoading(true);
		setError(null);
		setUpdatedAt(null);
	}, [page]);

	useEffect(() => {
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;

		async function load() {
			setLoading(true);
			try {
				const result = await getAiUsage(page, PAGE_SIZE, controller.signal);
				if (!controller.signal.aborted) {
					setResponse(result);
					setUpdatedAt(new Date());
					setError(null);
				}
			} catch (cause) {
				if (!controller.signal.aborted)
					setError(
						cause instanceof InvalidAiUsageResponseError
							? cause.message
							: "Não foi possível atualizar o uso de IA. Tente novamente.",
					);
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
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

	return {
		users: response?.page === page ? response.data : [],
		page,
		size: PAGE_SIZE,
		totalElements: response?.totalElements ?? 0,
		totalPages: response?.totalPages ?? 0,
		loading,
		error,
		updatedAt: response?.page === page ? updatedAt : null,
		reload,
		setPage,
	};
}
