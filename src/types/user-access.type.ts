export interface UserAccess {
  userId: string;
  photoUrl: string | null;
  name: string;
  email: string;
  active: boolean;
  permissionId: string;
  permissionName: string;
}

export interface UpdateUserAccessPayload {
  permissionId: string;
}

export interface UpdateUserStatusPayload {
  active: boolean;
}
