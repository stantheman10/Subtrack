import PasswordForm from "@/components/ui/PasswordForm";
import ProfileForm from "@/components/ui/ProfileForm";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <ProfileForm
        initialName={user.user_metadata.full_name ?? ""}
        email={user.email ?? ""}
      />
      <PasswordForm />
    </>
  );
}
