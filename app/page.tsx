import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error(error);
    return;
  }

  const claims = data?.claims;

  if (claims) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
