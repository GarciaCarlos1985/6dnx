import { SiteExperienceStudio } from "@/components/admin/site-experience-studio";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAdminSiteExperience } from "@/lib/site-experience/repository";

export const dynamic = "force-dynamic";

export default async function AdminSiteExperiencePage() {
  const session = await requireAdminPage();
  const initialRecord = await getAdminSiteExperience(session.supabase);

  return (
    <SiteExperienceStudio
      initialRecord={initialRecord}
      userEmail={session.user.email}
    />
  );
}
