"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  selectedMonth?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  selectedMonth,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          {title}
        </h1>

        {selectedMonth && (
          <div className="mt-1">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                router.replace(`/dashboard?month=${e.target.value}`);
                router.refresh();
              }}
              className="bg-transparent border-none p-0 text-sm outline-none cursor-pointer"
              style={{ color: "var(--color-muted)" }}
            />
          </div>
        )}
      </div>

      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}
