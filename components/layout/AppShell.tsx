"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  RefreshCcw,
  Target,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { processDueSubscriptions } from "@/lib/subscription-processor";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCcw },
  { href: "/goals", label: "Goals", icon: Target },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Process any due subscriptions on every app load
  useEffect(() => {
    const supabase = createClient();
    processDueSubscriptions(supabase);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-56 border-r shrink-0"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--color-accent)" }}
            >
              B
            </div>
            <span
              className="font-semibold tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              Subtrack
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "text-white" : "hover:bg-[var(--color-subtle)]",
                )}
                style={
                  active
                    ? { background: "var(--color-accent)", color: "white" }
                    : { color: "var(--color-ink-2)" }
                }
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors hover:bg-[var(--color-subtle)]"
            style={{ color: "var(--color-muted)" }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 border-t z-50"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <div className="flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
                style={
                  active
                    ? { color: "var(--color-accent)" }
                    : { color: "var(--color-muted)" }
                }
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
