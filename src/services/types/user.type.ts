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
