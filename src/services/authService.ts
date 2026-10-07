import { auth, api, sessionStorage } from "../lib";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import type { SignInResponse } from "../types";
import { serviceRequest } from "./serviceRequest";

async function signInWithBackend(idToken: string): Promise<SignInResponse> {
  return serviceRequest(async () => {
    const { data } = await api.post<SignInResponse>("/auth/signin", null, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    return data;
  }, "Não foi possível autenticar no serviço.");
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResponse> {
  return serviceRequest(async () => {
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
