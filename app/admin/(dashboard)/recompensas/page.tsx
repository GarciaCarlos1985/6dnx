import { RewardManager } from "@/components/admin/reward-manager";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminRewardUsers } from "@/lib/rewards/admin-repository";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const session = await requireAdminPage();
  const initialList = await listAdminRewardUsers(session.supabase);
  return (
    <RewardManager
      initialList={initialList}
      userEmail={session.user.email}
    />
  );
}
