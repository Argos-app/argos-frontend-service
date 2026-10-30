import { useCallback, useEffect, useRef, useState } from "react";
import App from "antd/es/app";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import { exportHerdReport, getHerdReportError, getHerdReports } from "@/services/herdReportService";
import { getProperties } from "@/services/propertyService";
import type { HerdReportItem } from "@/types/herd-report.type";
import type { UserProfileProperty } from "@/types/user-profile.type";

type RequestError = Awaited<ReturnType<typeof getHerdReportError>>;
const LIST_ERROR = "Não foi possível carregar os relatórios de rebanho.";
const INITIAL_PROPERTIES = { properties: [] as UserProfileProperty[], loading: true, error: null as RequestError | null };

export function useHerdReports(propertyId?: string) {
  const [failure, setFailure] = useState<RequestError | null>(null);
  const loadPage = useCallback(async (page: number, size: number, signal: AbortSignal) => {
    try {
      const response = await getHerdReports(page, size, signal, propertyId);
      if (!signal.aborted) setFailure(null);
      return response;
    } catch (error) {
      const failure = await getHerdReportError(error, LIST_ERROR);
      if (!signal.aborted) setFailure(failure);
      throw error;
    }
  }, [propertyId]);
  const resource = usePaginatedResource<HerdReportItem>(loadPage, LIST_ERROR);
  return {
    ...resource,
    error: resource.error ? failure?.message ?? resource.error : null,
    unauthorized: Boolean(resource.error && failure?.status === 401),
  };
}

export function useHerdReportProperties() {
  const [state, setState] = useState(INITIAL_PROPERTIES);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const properties: UserProfileProperty[] = [];
        let page = 0;
        let last = false;
        while (!last && !controller.signal.aborted) {
          const result = await getProperties(page, 100, controller.signal);
          properties.push(...result.data.map(({ id, name }) => ({ id, name })));
          last = result.last || page + 1 >= result.totalPages;
          page += 1;
        }
        if (!controller.signal.aborted) setState({ properties, loading: false, error: null });
      } catch (error) {
        const failure = await getHerdReportError(error, "Não foi possível carregar as fazendas.");
        if (!controller.signal.aborted) setState({ properties: [], loading: false, error: failure });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  function reload() {
    setState(INITIAL_PROPERTIES);
    setAttempt((current) => current + 1);
  }
  return { ...state, reload };
}

export function useHerdReportDownload() {
  const { message } = App.useApp();
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [error, setError] = useState<RequestError | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function download(report: HerdReportItem) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setDownloadingReportId(report.id);
    setError(null);
    try {
      const { blob, filename } = await exportHerdReport(report.id, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      try {
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        // O navegador precisa processar o clique antes da liberação do arquivo.
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      void message.success("Download iniciado.");
    } catch (cause) {
      const failure = await getHerdReportError(cause, "Não foi possível baixar o relatório. Tente novamente.");
      if (!controller.signal.aborted) {
        setError(failure);
        void message.error(failure.message);
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setDownloadingReportId(null);
    }
  }

  return { downloadingReportId, error, download };
}
