import { useCallback, useEffect, useReducer } from "react";
import type { PageResponse } from "../types";

interface State<T> {
  data: T[];
  meta: PageResponse<T> | null;
  page: number;
  size: number;
  attempt: number;
  loading: boolean;
  error: string | null;
}

type Action<T> =
  | { type: "page-changed"; page: number }
  | { type: "size-changed"; size: number }
  | { type: "reload" }
  | { type: "loaded"; response: PageResponse<T> }
  | { type: "failed"; message: string };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "page-changed":
      return { ...state, page: action.page, loading: true, error: null };
    case "size-changed":
      return { ...state, size: action.size, page: 0, loading: true, error: null };
    case "reload":
      return { ...state, attempt: state.attempt + 1, loading: true, error: null };
    case "loaded":
      return { ...state, data: action.response.data, meta: action.response, loading: false, error: null };
    case "failed":
      return { ...state, data: [], meta: null, loading: false, error: action.message };
  }
}

type PageLoader<T> = (page: number, size: number, signal: AbortSignal) => Promise<PageResponse<T>>;

export function usePaginatedResource<T>(loadPage: PageLoader<T>, errorMessage: string, initialPage = 0) {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: [],
    meta: null,
    page: initialPage,
    size: 10,
    attempt: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    loadPage(state.page, state.size, controller.signal)
      .then((response) => dispatch({ type: "loaded", response }))
      .catch(() => {
        if (!controller.signal.aborted) dispatch({ type: "failed", message: errorMessage });
      });
    return () => controller.abort();
  }, [loadPage, state.page, state.size, state.attempt, errorMessage]);

  const setPage = useCallback((page: number) => dispatch({ type: "page-changed", page }), []);
  const setSize = useCallback((size: number) => dispatch({ type: "size-changed", size }), []);
  const reload = useCallback(() => dispatch({ type: "reload" }), []);

  return {
    ...state,
    setPage,
    setSize,
    reload,
    totalElements: state.meta?.totalElements ?? 0,
    totalPages: state.meta?.totalPages ?? 0,
    first: state.meta?.first ?? true,
    last: state.meta?.last ?? true,
  };
}
