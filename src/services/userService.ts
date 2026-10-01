import { api } from "../lib";
import type { PageResponse } from "./types/page-response.type";
import type { User } from "./types/user.type";

export async function getUsers(page = 0, size = 10): Promise<PageResponse<User>> {
  const { data } = await api.get<PageResponse<User>>("/users", { params: { page, size } });
  return data;
}
