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
import type { SignInResponse } from "@/types/sign-in-response.type";
import { serviceRequest } from "@/services/serviceRequest";

async function signInWithBackend(idToken: string, expectedUid: string): Promise<SignInResponse> {
  return serviceRequest(async () => {
    if (auth.currentUser?.uid !== expectedUid) throw new Error("A sessão foi alterada durante a autenticação.");
    const { data } = await api.post<SignInResponse>("/auth/signin", null, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (auth.currentUser?.uid !== expectedUid) throw new Error("A sessão foi alterada durante a autenticação.");
    return data;
  }, "Não foi possível autenticar no serviço.");
}

let backendTokenRefresh: { uid: string | null; promise: Promise<string> } | null = null;

export function refreshBackendToken(): Promise<string> {
  const firebaseUser = auth.currentUser;
  const uid = firebaseUser?.uid ?? null;
  if (!backendTokenRefresh || backendTokenRefresh.uid !== uid) {
    const promise = serviceRequest(async () => {
      if (!firebaseUser) throw new Error("Não há usuário autenticado.");
      const firebaseToken = await firebaseUser.getIdToken(true);
      const data = await signInWithBackend(firebaseToken, firebaseUser.uid);
      if (auth.currentUser?.uid !== firebaseUser.uid) throw new Error("A sessão foi alterada durante a renovação.");
      sessionStorage.setToken(data.bearerToken);
      return data.bearerToken;
    }, "Não foi possível renovar a sessão.").finally(() => {
      if (backendTokenRefresh?.promise === promise) backendTokenRefresh = null;
    });
    backendTokenRefresh = { uid, promise };
  }
  return backendTokenRefresh.promise;
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
    const data = await signInWithBackend(idToken, user.uid);
    if (auth.currentUser?.uid !== user.uid) throw new Error("A sessão foi alterada durante o login.");
    sessionStorage.setSession(data.bearerToken, { userName: data.userName, farmName: data.farmName });
    return data;
  }, "Não foi possível realizar o login.");
}

export async function logout(): Promise<void> {
  return serviceRequest(async () => {
    await signOut(auth);
    sessionStorage.clear();
  }, "Não foi possível encerrar a sessão.");
}

export async function resetPassword(email: string): Promise<void> {
  return serviceRequest(() => sendPasswordResetEmail(auth, email), "Não foi possível enviar o e-mail de redefinição.");
}
