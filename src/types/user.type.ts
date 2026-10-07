export interface User {
  userId: string;
  photoUrl: string;
  name: string;
  email: string;
  cpf: string | null;
  active: boolean;
  farmName: string;
  cnpj: string | null;
  linkDate: string;
  propertyId: string;
  permissionId: string;
}

export interface UserOption {
  id: string;
  name: string;
}

export interface UserCreationOptions {
  properties: UserOption[];
  permissions: UserOption[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  cpf: string;
  password: string;
  permissionId: string;
  propertyId: string;
}

export interface CreatedUser {
  userId: string;
  name: string;
  email: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  cpf: string;
  permissionId: string;
  currentPropertyId: string;
  propertyId: string;
}
