export interface UserProfileProperty {
  id: string;
  name: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  cpf: string;
  photoUrl: string | null;
  permissionName: string;
  permissionCode: string;
  active: boolean;
  properties: UserProfileProperty[];
}
