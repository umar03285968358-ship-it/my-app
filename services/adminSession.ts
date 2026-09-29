import { getUser } from "@/services/authStorage";

export async function getAdminUserId(): Promise<number> {
  const user = await getUser();
  const id = user?.mobUserID ?? user?.MobUserID;
  return Number(id) || 0;
}