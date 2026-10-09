import { useCallback, useEffect, useReducer } from "react";
import type { PageResponse } from "@/types";

interface ResourceState<T> {
  data: T[];
  meta: Omit<PageResponse<T>, "data"> | null;
  page: number;
  size: number;
  attempt: number;
}

type State<T> = ResourceState<T> & (
  | { status: "loading"; error: null }
  | { status: "success"; error: null }
  | { status: "error"; error: string }
);

type Action<T> =
  | { type: "page-changed"; page: number }
  | { type: "size-changed"; size: number }
  | { type: "reload" }
  | { type: "loaded"; response: PageResponse<T>; page: number; size: number; attempt: number }
  | { type: "failed"; message: string; page: number; size: number; attempt: number };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "page-changed":
      if (state.page === action.page) return state;
      return { ...state, data: [], meta: null, page: action.page, status: "loading", error: null };
    case "size-changed":
      if (state.size === action.size) return state;
      return { ...state, data: [], meta: null, size: action.size, page: 0, status: "loading", error: null };
    case "reload":
      return { ...state, attempt: state.attempt + 1, status: "loading", error: null };
    case "loaded": {
      if (state.page !== action.page || state.size !== action.size || state.attempt !== action.attempt) return state;
      const { data, ...meta } = action.response;
      return { ...state, data, meta, status: "success", error: null };
    }
    case "failed":
      if (state.page !== action.page || state.size !== action.size || state.attempt !== action.attempt) return state;
      return { ...state, data: [], meta: null, status: "error", error: action.message };
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
    status: "loading",
    error: null,
  });

  const { page, size, attempt } = state;

  useEffect(() => {
    const controller = new AbortController();
    loadPage(page, size, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) dispatch({ type: "loaded", response, page, size, attempt });
      })
      .catch(() => {
        if (!controller.signal.aborted) dispatch({ type: "failed", message: errorMessage, page, size, attempt });
      });
    return () => controller.abort();
  }, [loadPage, page, size, attempt, errorMessage]);

  const setPage = useCallback((page: number) => dispatch({ type: "page-changed", page }), []);
  const setSize = useCallback((size: number) => dispatch({ type: "size-changed", size }), []);
  const reload = useCallback(() => dispatch({ type: "reload" }), []);

  return {
    ...state,
    loading: state.status === "loading",
    setPage,
    setSize,
    reload,
    totalElements: state.meta?.totalElements ?? 0,
    totalPages: state.meta?.totalPages ?? 0,
    first: state.meta?.first ?? true,
    last: state.meta?.last ?? true,
  };
}
