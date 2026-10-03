export interface SignInResponse {
  bearerToken: string;
  userName: string;
  email: string;
  farmName: string | null;
  isFirstAccess: boolean;
}
