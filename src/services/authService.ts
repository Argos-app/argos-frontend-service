import { auth } from "@/lib/firebase";
import { api } from "@/lib/httpClient";
import { sessionStorage } from "@/lib/sessionStorage";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import type { SignInResponse } from "@/types";
import { serviceRequest } from "@/services/serviceRequest";

async function signInWithBackend(idToken: string): Promise<SignInResponse> {
  return serviceRequest(async () => {
    const { data } = await api.post<SignInResponse>("/auth/signin", null, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    return data;
  }, "Não foi possível autenticar no serviço.");
}

let backendTokenRefresh: Promise<string> | null = null;

export function refreshBackendToken(): Promise<string> {
  if (!backendTokenRefresh) {
    backendTokenRefresh = serviceRequest(async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Não há usuário autenticado.");
      const firebaseToken = await firebaseUser.getIdToken(true);
      const data = await signInWithBackend(firebaseToken);
      sessionStorage.setToken(data.bearerToken);
      return data.bearerToken;
    }, "Não foi possível renovar a sessão.").finally(() => {
      backendTokenRefresh = null;
    });
  }
  return backendTokenRefresh;
}

export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe = false,
): Promise<SignInResponse> {
  return serviceRequest(async () => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await user.getIdToken();
    return signInWithBackend(idToken);
  }, "Não foi possível realizar o login.");
}

export async function logout(): Promise<void> {
  return serviceRequest(async () => {
    await signOut(auth);
    sessionStorage.clear();
  }, "Não foi possível encerrar a sessão.");
}

export async function resetPassword(email: string): Promise<void> {
  // TODO: validate if the email is registered in the backend before sending the reset email
  return serviceRequest(() => sendPasswordResetEmail(auth, email), "Não foi possível enviar o e-mail de redefinição.");
}
