import { auth, api } from "../lib";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import type { SignInResponse } from "./types/sign-in-response.type";

async function signInWithBackend(idToken: string): Promise<SignInResponse> {
  const { data } = await api.post<SignInResponse>("/auth/signin", null, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  return data;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResponse> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken();
  return signInWithBackend(idToken);
}

export async function logout(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem("bearerToken");
  localStorage.removeItem("user");
}

export async function resetPassword(email: string): Promise<void> {
  // TODO: validate if the email is registered in the backend before sending the reset email
  await sendPasswordResetEmail(auth, email);
}
