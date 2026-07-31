import { getAdminSession } from "@/lib/admin/auth";
import { noStoreJson } from "@/lib/admin/api";

export async function GET() {
  const result = await getAdminSession();
  if (!result.ok) {
    return noStoreJson(
      { authenticated: false, reason: result.reason },
      result.reason === "forbidden" ? 403 : 401,
    );
  }

  return noStoreJson({
    authenticated: true,
    user: result.session.user,
  });
}
