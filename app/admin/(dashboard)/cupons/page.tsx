import { CouponManager } from "@/components/admin/coupon-manager";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminCoupons } from "@/lib/coupons/admin-repository";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = await requireAdminPage();
  const initialList = await listAdminCoupons(session.supabase);
  return (
    <CouponManager
      initialList={initialList}
      userEmail={session.user.email}
    />
  );
}
