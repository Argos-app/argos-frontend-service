import axios from "axios";
import { FirebaseError } from "firebase/app";

export function getSignInErrorMessage(error: unknown): string {
  const fallback = "Não foi possível realizar o login. Tente novamente mais tarde.";

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Credenciais inválidas";
      case "auth/invalid-email":
        return "Informe um e-mail válido.";
      case "auth/user-disabled":
        return "Esta conta está desativada. Entre em contato com o administrador.";
      case "auth/too-many-requests":
        return "Muitas tentativas de login. Tente novamente mais tarde.";
      case "auth/network-request-failed":
        return "Não foi possível conectar. Verifique sua conexão e tente novamente.";
      default:
        return fallback;
    }
  }

  const message: unknown = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
  return typeof message === "string" && message.trim() ? message : fallback;
}
