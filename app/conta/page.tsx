import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account-dashboard";
import { experienceThemeStyle } from "@/lib/site-experience/presentation";
import { getSiteExperience } from "@/lib/site-experience/repository";
import { safeAccountReturn } from "@/lib/account/return-path";

export const metadata: Metadata = {
  title: "Minha Conta",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ retorno?: string }>;
}) {
  const experience = await getSiteExperience();
  const { retorno } = await searchParams;
  return (
    <AccountDashboard
      returnTo={safeAccountReturn(retorno)}
      content={experience.account.content}
      effects={experience.account.effects}
      themeStyle={experienceThemeStyle(
        experience.account.theme,
        experience.account.background,
      )}
    />
  );
}
