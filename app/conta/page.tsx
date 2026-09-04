import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account-dashboard";
import { experienceThemeStyle } from "@/lib/site-experience/presentation";
import { getSiteExperience } from "@/lib/site-experience/repository";

export const metadata: Metadata = {
  title: "Minha Conta",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const experience = await getSiteExperience();
  return (
    <AccountDashboard
      content={experience.account.content}
      effects={experience.account.effects}
      themeStyle={experienceThemeStyle(experience.account.theme, experience.account.background)}
    />
  );
}
