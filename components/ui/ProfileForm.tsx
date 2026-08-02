"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ProfileFormProps = {
  initialName: string;
  email: string;
};

export default function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.refresh();

    toast.success("Profile updated!");
  }

  return (
    <div className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="mt-2 text-sm text-gray-500">
          Update your personal information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email Address
          </label>

          <input
            value={email}
            disabled
            className="h-12 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm text-gray-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
