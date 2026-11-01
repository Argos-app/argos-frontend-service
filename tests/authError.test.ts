import assert from "node:assert/strict";
import { test } from "node:test";
import { AxiosError } from "axios";
import { FirebaseError } from "firebase/app";
import { getSignInErrorMessage } from "../src/utils/authError.ts";

test("traduz os erros de login do Firebase", () => {
  const cases = [
    ["auth/invalid-credential", "Credenciais inválidas"],
    ["auth/wrong-password", "Credenciais inválidas"],
    ["auth/user-not-found", "Credenciais inválidas"],
    ["auth/invalid-email", "Informe um e-mail válido."],
    ["auth/user-disabled", "Esta conta está desativada. Entre em contato com o administrador."],
    ["auth/too-many-requests", "Muitas tentativas de login. Tente novamente mais tarde."],
    ["auth/network-request-failed", "Não foi possível conectar. Verifique sua conexão e tente novamente."],
  ];

  for (const [code, message] of cases) {
    assert.equal(getSignInErrorMessage(new FirebaseError(code, "Mensagem técnica do Firebase")), message, code);
  }
});

test("usa uma mensagem amigável para erros desconhecidos ou respostas inválidas", () => {
  const errors = [
    new FirebaseError("auth/internal-error", "Detalhes internos do Firebase"),
    new Error("Detalhes internos"),
    new AxiosError("Network Error"),
    null,
    undefined,
    "Erro técnico",
    ...[undefined, "", "   ", { detail: "Erro interno" }].map((message) =>
      Object.assign(new AxiosError(), { response: { data: { message } } }),
    ),
  ];

  for (const error of errors) {
    assert.equal(getSignInErrorMessage(error), "Não foi possível realizar o login. Tente novamente mais tarde.");
  }
});

test("preserva mensagens de erro retornadas pelo backend", () => {
  const error = Object.assign(new AxiosError(), {
    response: { data: { message: "Usuário sem permissão de acesso." } },
  });

  assert.equal(getSignInErrorMessage(error), "Usuário sem permissão de acesso.");
});
