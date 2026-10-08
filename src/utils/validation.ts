import type { CreateUserPayload, UpdateUserAccessPayload, UpdateUserPayload } from "../types";
import type { PropertyPayload } from "../types";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Partial<Record<keyof T, string>> };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUserFields<T extends { name: string; email: string; cpf: string; permissionId: string; propertyId: string }>(
  values: T,
): ValidationResult<T> {
  const data = {
    ...values,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    cpf: values.cpf.replace(/\D/g, ""),
  };
  const errors: Partial<Record<keyof T, string>> = {};

  if (!data.name || data.name.length > 120) errors.name = "O nome é obrigatório e deve ter até 120 caracteres.";
  if (!isValidEmail(data.email) || data.email.length > 120) errors.email = "Informe um e-mail válido com até 120 caracteres.";
  if (!isValidCPF(data.cpf)) errors.cpf = "Informe um CPF válido com 11 dígitos.";
  if (!data.permissionId) errors.permissionId = "Selecione uma permissão.";
  if (!data.propertyId) errors.propertyId = "Selecione uma fazenda.";

  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data };
}

export function validateCreateUser(values: CreateUserPayload): ValidationResult<CreateUserPayload> {
  const common = validateUserFields(values);
  if (!common.success) {
    const errors = { ...common.errors };
    if (values.password.length < 8 || values.password.length > 128) {
      errors.password = "A senha deve ter entre 8 e 128 caracteres.";
    }
    return { success: false, errors };
  }
  const errors: Partial<Record<keyof CreateUserPayload, string>> = {};
  if (values.password.length < 8 || values.password.length > 128) {
    errors.password = "A senha deve ter entre 8 e 128 caracteres.";
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { ...common.data, password: values.password } };
}

type EditableUserFields = Omit<UpdateUserPayload, "currentPropertyId">;

export function validateUpdateUser(values: EditableUserFields): ValidationResult<EditableUserFields> {
  return validateUserFields(values);
}

export function validateUpdateUserAccess(values: UpdateUserAccessPayload): ValidationResult<UpdateUserAccessPayload> {
  const data = { permissionId: values.permissionId.trim() };
  const errors: Partial<Record<keyof UpdateUserAccessPayload, string>> = {};
  if (!data.permissionId) errors.permissionId = "Selecione uma permissão.";
  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data };
}

export function validateProperty(values: PropertyPayload): ValidationResult<PropertyPayload> {
  const data: PropertyPayload = {
    ...values,
    name: values.name.trim(),
    cnpj: values.cnpj ? cleanCNPJ(values.cnpj) || null : null,
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
    phone: values.phone?.trim() || null,
  };
  const errors: Partial<Record<keyof PropertyPayload, string>> = {};
  if (!data.name || data.name.length > 120) errors.name = "O nome é obrigatório e deve ter até 120 caracteres.";
  if (data.cnpj && !isValidCNPJ(data.cnpj)) errors.cnpj = "Informe um CNPJ válido.";
  if (!data.address || data.address.length > 255) errors.address = "O endereço é obrigatório e deve ter até 255 caracteres.";
  if (!data.city || data.city.length > 100) errors.city = "A cidade é obrigatória e deve ter até 100 caracteres.";
  if (!/^[A-Z]{2}$/.test(data.state)) errors.state = "Informe uma UF válida.";
  if (data.areaHectares != null && data.areaHectares <= 0) errors.areaHectares = "A área deve ser maior que zero.";
  if (data.phone && data.phone.length > 20) errors.phone = "O telefone deve ter até 20 caracteres.";
  if (!data.responsibleAdminId) errors.responsibleAdminId = "Selecione o administrador responsável.";
  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data };
}
import { cleanCNPJ, isValidCNPJ, isValidCPF } from "cnpj-cpf-validator";
