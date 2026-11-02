import assert from "node:assert/strict";
import { test } from "node:test";
import axios, { AxiosError, CanceledError } from "axios";
import { FirebaseError } from "firebase/app";
import { serviceRequest } from "../src/services/serviceRequest.ts";

test("serviceRequest devolve o resultado da operação", async () => {
	const data = { id: "teste" };
	assert.equal(await serviceRequest(async () => data, "fallback"), data);
});

test("preserva a identidade de erros Axios, Firebase e cancelamento", async () => {
	const errors = [
		new AxiosError("não autorizado", "ERR_BAD_REQUEST"),
		new FirebaseError("auth/user-disabled", "inativa"),
		new CanceledError("cancelado"),
	];
	for (const error of errors) {
		await assert.rejects(
			serviceRequest(async () => {
				throw error;
			}, "fallback"),
			(actual) => actual === error,
		);
	}
	assert.equal(axios.isCancel(errors[2]), true);
});

test("falha desconhecida recebe fallback e mantém a causa", async () => {
	const cause = new Error("falha interna");
	await assert.rejects(
		serviceRequest(async () => {
			throw cause;
		}, "Não foi possível consultar."),
		(error: Error) => {
			assert.equal(error.message, "Não foi possível consultar.");
			assert.equal(error.cause, cause);
			return true;
		},
	);
});
