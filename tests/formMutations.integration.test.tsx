import { act, useEffect } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	useUserAccessMutation,
	useUserMutations,
	useUserStatusMutation,
} from "@/hooks/useUserManagement";
import { usePropertyMutations } from "@/hooks/usePropertyManagement";
import { cleanup, render } from "./reactDom";

const services = vi.hoisted(() => ({
	createUser: vi.fn(),
	updateUser: vi.fn(),
	updateUserAccess: vi.fn(),
	updateUserStatus: vi.fn(),
	createProperty: vi.fn(),
	updateProperty: vi.fn(),
}));
vi.mock("@/services/userService", () => ({
	...services,
	deleteUser: vi.fn(),
	getUserCreationOptions: vi.fn(),
}));
vi.mock("@/services/userAccessService", () => ({ ...services, getPermissionOptions: vi.fn() }));
vi.mock("@/services/propertyService", () => ({
	...services,
	deactivateProperty: vi.fn(),
	getAdministrators: vi.fn(),
}));

let users: ReturnType<typeof useUserMutations>;
let properties: ReturnType<typeof usePropertyMutations>;
let access: ReturnType<typeof useUserAccessMutation>;
let status: ReturnType<typeof useUserStatusMutation>;

function MutationProbe() {
	const userActions = useUserMutations();
	const propertyActions = usePropertyMutations();
	const accessActions = useUserAccessMutation();
	const statusActions = useUserStatusMutation();
	useEffect(() => {
		users = userActions;
		properties = propertyActions;
		access = accessActions;
		status = statusActions;
	}, [userActions, propertyActions, accessActions, statusActions]);
	return null;
}

const id = "11111111-1111-4111-8111-111111111111";
const user = {
	name: " Pessoa ",
	email: " PESSOA@EXAMPLE.COM ",
	cpf: "529.982.247-25",
	password: " senha 123 ",
	permissionId: id,
	propertyId: id,
};
const property = {
	name: " Fazenda ",
	address: " Rua ",
	city: " Cidade ",
	state: "sp",
	responsibleAdminId: id,
};
beforeEach(async () => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	await render(<MutationProbe />);
});
afterEach(cleanup);

test("cadastro e edição bloqueiam inválidos e encaminham apenas o resultado validado", async () => {
	await act(async () => {
		await users.create({ ...user, cpf: "123" });
	});
	expect(services.createUser).not.toHaveBeenCalled();
	await act(async () => {
		await users.create(user);
	});
	expect(services.createUser).toHaveBeenCalledExactlyOnceWith({
		...user,
		name: "Pessoa",
		email: "pessoa@example.com",
		cpf: "52998224725",
	});
	const update = {
		name: user.name,
		email: user.email,
		cpf: user.cpf,
		permissionId: id,
		propertyId: id,
		currentPropertyId: id,
	};
	await act(async () => {
		await users.update(id, { ...update, currentPropertyId: "" });
	});
	expect(services.updateUser).not.toHaveBeenCalled();
	await act(async () => {
		await users.update(id, update);
	});
	expect(services.updateUser).toHaveBeenCalledExactlyOnceWith(id, {
		...update,
		name: "Pessoa",
		email: "pessoa@example.com",
		cpf: "52998224725",
	});
});

test("propriedade bloqueia campos inválidos e normaliza o payload antes do service", async () => {
	await act(async () => {
		await properties.save(null, { ...property, areaHectares: -1 });
	});
	expect(services.createProperty).not.toHaveBeenCalled();
	await act(async () => {
		await properties.save(null, property);
	});
	expect(services.createProperty).toHaveBeenCalledExactlyOnceWith({
		...property,
		name: "Fazenda",
		address: "Rua",
		city: "Cidade",
		state: "SP",
		cnpj: null,
		areaHectares: null,
		phone: null,
	});
});

test("permissão e status bloqueiam valores inválidos e preservam active false", async () => {
	await act(async () => {
		await access.updateAccess(id, { permissionId: "inválido" });
	});
	expect(services.updateUserAccess).not.toHaveBeenCalled();
	await act(async () => {
		await access.updateAccess(id, { permissionId: ` ${id} ` });
	});
	expect(services.updateUserAccess).toHaveBeenCalledExactlyOnceWith(id, { permissionId: id });
	await expect(
		status.updateStatus(id, { active: "false" } as unknown as { active: boolean }),
	).rejects.toThrow();
	expect(services.updateUserStatus).not.toHaveBeenCalled();
	await status.updateStatus(id, { active: false });
	expect(services.updateUserStatus).toHaveBeenCalledExactlyOnceWith(id, { active: false });
});
