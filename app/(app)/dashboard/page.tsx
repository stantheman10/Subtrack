import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, subDays, parse } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SpendByCategoryChart from "@/components/charts/SpendByCategoryChart";
import SpendOverTimeChart from "@/components/charts/SpendOverTimeChart";
import GoalProgressRing from "@/components/charts/GoalProgressRing";
import BudgetSettings from "@/app/(app)/dashboard/settings";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const selectedMonth = params.month ?? format(new Date(), "yyyy-MM");

  const monthDate = parse(selectedMonth, "yyyy-MM", new Date());
  const supabase = await createClient();
  const now = new Date();
  const monthStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(now, 29), "yyyy-MM-dd");
  const today = format(now, "yyyy-MM-dd");

  // Parallel fetches
  const [
    { data: monthTxns },
    { data: last30Txns },
    { data: goals },
    { data: settings },
    { data: upcomingSubscriptions },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd),
    supabase
      .from("transactions")
      .select("amount, transaction_date, type")
      .gte("transaction_date", thirtyDaysAgo)
      .lte("transaction_date", today),
    supabase.from("savings_goals").select("*").limit(1).single(),
    supabase.from("settings").select("*").single(),
    supabase
      .from("subscriptions")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .gte("next_billing_date", today)
      .lte("next_billing_date", format(subDays(now, -7), "yyyy-MM-dd"))
      .order("next_billing_date", { ascending: true })
      .limit(5),
  ]);

  // KPIs
  const expenses = (monthTxns ?? []).filter((t) => t.type === "expense");
  const income = (monthTxns ?? []).filter((t) => t.type === "income");
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
  const monthlyBudget = settings?.monthly_budget ?? 0;
  const budgetUsedPct =
    monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  // Spend by category (donut chart)
  const categoryMap: Record<
    string,
    { name: string; value: number; color: string; icon: string }
  > = {};
  for (const t of expenses) {
    const cat = t.category;
    const key = cat?.id ?? "uncategorized";
    if (!categoryMap[key]) {
      categoryMap[key] = {
        name: cat?.name ?? "Uncategorized",
        value: 0,
        color: cat?.color ?? "#6b7280",
        icon: cat?.icon ?? "📦",
      };
    }
    categoryMap[key].value += Number(t.amount);
  }
  const categoryData = Object.values(categoryMap).sort(
    (a, b) => b.value - a.value,
  );

  // Spend over time (bar chart)
  const dateMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(now, i), "yyyy-MM-dd");
    dateMap[d] = 0;
  }
  for (const t of last30Txns ?? []) {
    if (t.type === "expense") {
      dateMap[t.transaction_date] =
        (dateMap[t.transaction_date] ?? 0) + Number(t.amount);
    }
  }
  const timeData = Object.entries(dateMap).map(([date, amount]) => ({
    date,
    amount,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        selectedMonth={selectedMonth}
        action={<BudgetSettings current={monthlyBudget} />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="This month"
          value={formatCurrency(totalExpenses)}
          sub="total spent"
          danger={monthlyBudget > 0 && totalExpenses > monthlyBudget}
        />
        <StatCard
          label="Income"
          value={formatCurrency(totalIncome)}
          sub="this month"
        />
        <StatCard
          label="Budget"
          value={monthlyBudget > 0 ? formatCurrency(monthlyBudget) : "—"}
          sub={
            monthlyBudget > 0 ? `${Math.round(budgetUsedPct)}% used` : "not set"
          }
        />
        <StatCard
          label="Left to spend"
          value={
            monthlyBudget > 0
              ? formatCurrency(Math.max(0, monthlyBudget - totalExpenses))
              : "—"
          }
          sub="this month"
          accent={monthlyBudget > 0 && totalExpenses <= monthlyBudget}
        />
      </div>

      {/* Budget progress bar */}
      {monthlyBudget > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-ink-2)" }}
            >
              Monthly budget
            </span>
            <span className="text-sm" style={{ color: "var(--color-muted)" }}>
              {formatCurrency(totalExpenses)} / {formatCurrency(monthlyBudget)}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, budgetUsedPct)}%`,
                background:
                  budgetUsedPct >= 100
                    ? "var(--color-danger)"
                    : budgetUsedPct >= 80
                      ? "var(--color-warning)"
                      : "var(--color-accent)",
              }}
            />
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "var(--color-ink-2)" }}
          >
            Spend by category
          </h2>
          <SpendByCategoryChart data={categoryData} />
        </div>
        <div className="card">
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "var(--color-ink-2)" }}
          >
            Last 30 days
          </h2>
          <SpendOverTimeChart data={timeData} />
        </div>
      </div>

      {/* Goals + Upcoming subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {goals && (
          <div className="card">
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--color-ink-2)" }}
            >
              Savings goal
            </h2>
            <GoalProgressRing goal={goals} />
          </div>
        )}

        {(upcomingSubscriptions ?? []).length > 0 && (
          <div className="card">
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--color-ink-2)" }}
            >
              Upcoming subscriptions
            </h2>
            <ul className="space-y-3">
              {(upcomingSubscriptions ?? []).map((sub) => (
                <li key={sub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {sub.category?.icon ?? "📦"}
                    </span>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {sub.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {format(new Date(sub.next_billing_date), "dd MMM")}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-ink-2)" }}
                  >
                    {formatCurrency(sub.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
