import assert from "node:assert/strict";
import { test } from "node:test";
import {
	validateCreateUser,
	validateLogin,
	validatePasswordReset,
	validateProperty,
	validateUpdateUser,
	validateUpdateUserAccess,
	validateUpdateUserStatus,
} from "../src/utils/validation.ts";
import type { LoginValues, PasswordResetValues } from "../src/types/auth.type.ts";

const id = "11111111-1111-4111-8111-111111111111";
const user = {
	name: " Pessoa ",
	email: " PESSOA@EXAMPLE.COM ",
	cpf: "529.982.247-25",
	password: " senha 123 ",
	permissionId: id,
	propertyId: id,
};

test("login normaliza somente o e-mail e não altera a entrada", () => {
	const values = Object.freeze({ email: " PESSOA@EXAMPLE.COM ", password: " senha  " });
	assert.deepEqual(validateLogin(values), {
		success: true,
		data: { email: "pessoa@example.com", password: " senha  " },
	});
	assert.equal(values.email, " PESSOA@EXAMPLE.COM ");
});

test("e-mail verifica obrigatório, tamanho e formato nessa ordem", () => {
	for (const [email, message] of [
		["  ", "Informe o e-mail."],
		["x".repeat(121), "O e-mail deve ter até 120 caracteres."],
		["incorreto", "Informe um e-mail válido."],
	]) {
		assert.deepEqual(validatePasswordReset({ email }), {
			success: false,
			errors: { email: message },
		});
		assert.deepEqual(validateLogin({ email, password: "x" }), {
			success: false,
			errors: { email: message },
		});
	}
});

test("login aceita os limites e preserva senhas curtas e espaços literais", () => {
	const email = `${"a".repeat(108)}@example.com`;
	assert.equal(email.length, 120);
	for (const password of ["x", " ", "  senha  ", "x".repeat(128)]) {
		assert.deepEqual(validateLogin({ email, password }), {
			success: true,
			data: { email, password },
		});
	}
	assert.deepEqual(validateLogin({ email, password: "" }), {
		success: false,
		errors: { password: "Informe a senha." },
	});
	assert.deepEqual(validateLogin({ email, password: "x".repeat(129) }), {
		success: false,
		errors: { password: "A senha deve ter até 128 caracteres." },
	});
});

test("tipos incorretos em runtime retornam erros de campo", () => {
	for (const value of [null, undefined, 12, false, [], {}]) {
		assert.deepEqual(
			validatePasswordReset({ email: value } as unknown as PasswordResetValues),
			{ success: false, errors: { email: "Informe o e-mail." } },
		);
		assert.deepEqual(
			validateLogin({ email: value, password: value } as unknown as LoginValues),
			{
				success: false,
				errors: { email: "Informe o e-mail.", password: "Informe a senha." },
			},
		);
	}
});

test("cadastro continua validando CPF, UUID, limites e senha de criação", () => {
	const valid = validateCreateUser(user);
	assert.equal(valid.success, true);
	if (valid.success)
		assert.deepEqual(valid.data, {
			...user,
			name: "Pessoa",
			email: "pessoa@example.com",
			cpf: "52998224725",
		});
	for (const changes of [
		{ cpf: "123" },
		{ permissionId: "x" },
		{ propertyId: "x" },
		{ name: "x".repeat(121) },
		{ password: "x".repeat(7) },
		{ password: "x".repeat(129) },
	]) {
		assert.equal(validateCreateUser({ ...user, ...changes }).success, false);
	}
});

test("edição, permissão e status mantêm os contratos e active false", () => {
	const fields = {
		name: user.name,
		email: user.email,
		cpf: user.cpf,
		permissionId: id,
		propertyId: id,
	};
	assert.equal(validateUpdateUser({ ...fields, currentPropertyId: id }).success, true);
	assert.equal(validateUpdateUser({ ...fields, currentPropertyId: "" }).success, false);
	assert.equal(validateUpdateUserAccess({ permissionId: "x" }).success, false);
	assert.deepEqual(validateUpdateUserAccess({ permissionId: ` ${id} ` }), {
		success: true,
		data: { permissionId: id },
	});
	assert.deepEqual(validateUpdateUserStatus({ active: false }), {
		success: true,
		data: { active: false },
	});
	assert.equal(
		validateUpdateUserStatus({ active: "false" } as unknown as { active: boolean }).success,
		false,
	);
});

test("propriedade normaliza os dados e rejeita CNPJ e área inválidos", () => {
	const property = {
		name: " Fazenda ",
		cnpj: "11.222.333/0001-81",
		address: " Rua ",
		city: " Cidade ",
		state: " sp ",
		areaHectares: 1,
		phone: null,
		responsibleAdminId: id,
	};
	const valid = validateProperty(property);
	assert.equal(valid.success, true);
	if (valid.success)
		assert.deepEqual(valid.data, {
			...property,
			name: "Fazenda",
			cnpj: "11222333000181",
			address: "Rua",
			city: "Cidade",
			state: "SP",
		});
	for (const changes of [
		{ cnpj: "inválido" },
		{ areaHectares: 0 },
		{ areaHectares: Infinity },
		{ responsibleAdminId: "x" },
	]) {
		assert.equal(validateProperty({ ...property, ...changes }).success, false);
	}
});
