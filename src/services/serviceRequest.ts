import axios from "axios";

function preservesProviderError(error: unknown): boolean {
  if (axios.isAxiosError(error)) return true;
  return Boolean(error && typeof error === "object" && "code" in error);
}

export async function serviceRequest<T>(operation: () => Promise<T>, fallbackMessage: string): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (preservesProviderError(error)) throw error;
    throw new Error(fallbackMessage, { cause: error });
  }
}
