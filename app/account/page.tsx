import SiteShell from "@/components/SiteShell";
import AccountContent from "./AccountContent";

export const metadata = {
  title: "My Account · Awaken Bio Labs",
};

export default function AccountPage() {
  return (
    <SiteShell>
      <AccountContent />
    </SiteShell>
  );
}
