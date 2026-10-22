import { auth } from "@/lib/firebase";
import { api } from "@/lib/httpClient";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import type { SignInResponse } from "@/types/sign-in-response.type";
import { serviceRequest } from "@/services/serviceRequest";

export async function signInWithEmail(email: string, password: string): Promise<SignInResponse> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken();
  const { data } = await api.post<SignInResponse>("/auth/signin", null, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return data;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return serviceRequest(() => sendPasswordResetEmail(auth, email), "Não foi possível enviar o e-mail de redefinição.");
}
