import axios from "axios";
import { api } from "@/lib/api";
import { serviceRequest } from "@/services/serviceRequest";
import type { HerdReportItem } from "@/types/herd-report.type";
import type { PageResponse } from "@/types/page-response.type";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function getHerdReports(page: number, size: number, signal: AbortSignal, propertyId?: string) {
  return serviceRequest(async () => {
    const { data } = await api.get<PageResponse<HerdReportItem>>("/reports/herds", {
      params: { page, size, ...(propertyId ? { propertyId } : {}) },
      signal,
    });
    return data;
  }, "Não foi possível carregar os relatórios de rebanho.");
}

function downloadFilename(disposition: string, reportId: string): string {
  const fallback = `relatorio-rebanho-${reportId}.xlsx`;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  let filename = /filename=(?:"([^"]*)"|([^;]*))/i.exec(disposition)?.slice(1).find(Boolean);
  if (encoded) {
    try {
      filename = decodeURIComponent(encoded.trim());
    } catch {
      // Um cabeçalho malformado não deve impedir o download.
    }
  }
  const safeName = Array.from(filename || fallback, (character) =>
    character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? "_" : character,
  ).join("").replace(/[<>:"/\\|?*]/g, "_").trim().replace(/[. ]+$/g, "");
  const name = safeName || "relatorio-rebanho.xlsx";
  return name.toLowerCase().endsWith(".xlsx") ? name : `${name}.xlsx`;
}

export async function exportHerdReport(reportId: string, signal: AbortSignal) {
  return serviceRequest(async () => {
    const { data: blob, headers } = await api.get<Blob>(`/reports/herds/${encodeURIComponent(reportId)}/export`, {
      responseType: "blob",
      signal,
    });
    const contentType = String(headers["content-type"] ?? blob.type).split(";")[0].trim().toLowerCase();
    if (!(blob instanceof Blob) || blob.size === 0 || contentType !== XLSX_MIME) {
      throw new Error("O servidor não retornou um arquivo XLSX válido.");
    }
    const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    if (signature[0] !== 0x50 || signature[1] !== 0x4b || signature[2] !== 0x03 || signature[3] !== 0x04) {
      throw new Error("O servidor não retornou um arquivo XLSX válido.");
    }
    return { blob, filename: downloadFilename(String(headers["content-disposition"] ?? ""), reportId) };
  }, "Não foi possível baixar o relatório. Tente novamente.");
}

export async function getHerdReportError(error: unknown, fallback: string) {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401) return { status, message: "Sua sessão expirou. Entre novamente para continuar." };
  if (status === 403) return { status, message: "Você não possui permissão para acessar estes relatórios." };
  if (status === 404) return { status, message: "Relatório não encontrado ou indisponível." };

  let body: unknown = axios.isAxiosError(error) ? error.response?.data : null;
  if (body instanceof Blob) {
    try {
      body = JSON.parse(await body.text());
    } catch {
      body = null;
    }
  }
  const message = status === 400 && body && typeof body === "object" && "message" in body && typeof body.message === "string"
    ? body.message
    : fallback;
  return { status, message };
}
