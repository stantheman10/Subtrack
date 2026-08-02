import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error(error);
    return;
  }

  const claims = data?.claims;

  if (!claims) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
