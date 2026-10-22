import { auth } from "@/lib/firebase";
import { api } from "@/lib/httpClient";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import type { SignInResponse } from "@/types/sign-in-response.type";

export async function signInWithEmail(email: string, password: string, rememberMe: boolean): Promise<SignInResponse> {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return signInWithBackend(user);
}

export async function signInWithBackend(user: User): Promise<SignInResponse> {
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
  await sendPasswordResetEmail(auth, email);
}
