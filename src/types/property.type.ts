export interface Property {
  id: string;
  name: string;
  cnpj: string | null;
  address: string;
  city: string;
  state: string;
  areaHectares: number | null;
  phone: string | null;
  active: boolean;
  responsibleAdminId: string;
  responsibleAdminName: string;
}

export interface PropertyPayload {
  name: string;
  cnpj: string | null;
  address: string;
  city: string;
  state: string;
  areaHectares: number | null;
  phone: string | null;
  responsibleAdminId: string;
}

export type PropertyFormValues = Omit<PropertyPayload, "cnpj" | "areaHectares" | "phone"> & {
  cnpj?: string;
  areaHectares?: number | null;
  phone?: string;
};

export interface AdminUserOption {
  id: string;
  name: string;
  email: string;
}
