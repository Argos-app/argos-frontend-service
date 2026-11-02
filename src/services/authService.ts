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
import { serviceRequest } from "@/services/serviceRequest";

export async function signInWithEmail(
	email: string,
	password: string,
	rememberMe: boolean,
): Promise<SignInResponse> {
	const user = await serviceRequest(async () => {
		await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
		const { user } = await signInWithEmailAndPassword(auth, email, password);
		return user;
	}, "Não foi possível realizar o login.");
	return signInWithBackend(user);
}

export async function signInWithBackend(user: User): Promise<SignInResponse> {
	return serviceRequest(async () => {
		const idToken = await user.getIdToken();
		const { data } = await api.post<SignInResponse>("/auth/signin", null, {
			headers: { Authorization: `Bearer ${idToken}` },
		});
		return data;
	}, "Não foi possível realizar o login.");
}

export async function logout(): Promise<void> {
	return serviceRequest(() => signOut(auth), "Não foi possível encerrar a sessão.");
}

export async function resetPassword(email: string): Promise<void> {
	return serviceRequest(() => sendPasswordResetEmail(auth, email), "Não foi possível enviar o link de redefinição.");
}
