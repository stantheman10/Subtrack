"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getDailyTarget } from "@/lib/utils";
import type { SavingsGoal } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import GoalProgressRing from "@/components/charts/GoalProgressRing";

export default function GoalsPage() {
  const supabase = createClient();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalForm, setGoalForm] = useState({
    name: "",
    target_amount: "",
    target_date: format(
      new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      "yyyy-MM-dd",
    ),
  });
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState("");

  // Contribute modal
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(
    null,
  );
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributing, setContributing] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("savings_goals")
      .select("*")
      .order("created_at", { ascending: true });
    setGoals(data ?? []);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  function openAddGoal() {
    setEditingGoal(null);
    setGoalForm({
      name: "",
      target_amount: "",
      target_date: format(
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        "yyyy-MM-dd",
      ),
    });
    setGoalError("");
    setGoalModalOpen(true);
  }

  function openEditGoal(g: SavingsGoal) {
    setEditingGoal(g);
    setGoalForm({
      name: g.name,
      target_amount: String(g.target_amount),
      target_date: g.target_date,
    });
    setGoalError("");
    setGoalModalOpen(true);
  }

  async function handleSaveGoal() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!goalForm.name.trim()) {
      setGoalError("Name is required.");
      return;
    }
    if (!goalForm.target_amount || Number(goalForm.target_amount) <= 0) {
      setGoalError("Enter a valid target amount.");
      return;
    }
    setGoalSaving(true);
    setGoalError("");

    const payload = {
      user_id: user?.id,
      name: goalForm.name.trim(),
      target_amount: Number(goalForm.target_amount),
      target_date: goalForm.target_date,
    };

    if (editingGoal) {
      await supabase
        .from("savings_goals")
        .update(payload)
        .eq("id", editingGoal.id);
    } else {
      await supabase
        .from("savings_goals")
        .insert({ ...payload, current_amount: 0 });
    }

    setGoalSaving(false);
    setGoalModalOpen(false);
    fetchGoals();
  }

  async function handleDeleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    await supabase.from("savings_goals").delete().eq("id", id);
    fetchGoals();
  }

  async function handleContribute() {
    if (!contributeGoal) return;
    const amount = Number(contributeAmount);
    if (!amount || amount <= 0) return;
    setContributing(true);

    const newAmount = contributeGoal.current_amount + amount;

    await Promise.all([
      supabase
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", contributeGoal.id),
      supabase
        .from("goal_contributions")
        .insert({ goal_id: contributeGoal.id, amount }),
    ]);

    setContributing(false);
    setContributeGoal(null);
    setContributeAmount("");
    fetchGoals();
  }

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        subtitle="Track your progress and stay on target"
        action={
          <button className="btn btn-primary" onClick={openAddGoal}>
            <Plus size={15} /> Add goal
          </button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="card h-36 animate-pulse"
              style={{ background: "var(--color-subtle)" }}
            />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Create a savings goal and we'll tell you exactly how much to save each day."
          action={
            <button className="btn btn-primary" onClick={openAddGoal}>
              <Plus size={14} /> Create goal
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const { dailyTarget, daysLeft } = getDailyTarget(
              goal.target_amount,
              goal.current_amount,
              goal.target_date,
            );
            return (
              <div key={goal.id} className="card">
                <div className="flex items-start justify-between mb-5">
                  <div />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setContributeGoal(goal);
                        setContributeAmount("");
                      }}
                      className="btn btn-secondary text-xs px-2.5 py-1.5"
                      style={{ color: "var(--color-accent)" }}
                    >
                      <PiggyBank size={13} /> Add savings
                    </button>
                    <button
                      onClick={() => openEditGoal(goal)}
                      className="btn btn-ghost p-1.5 rounded"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="btn btn-ghost p-1.5 rounded"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <GoalProgressRing goal={goal} />

                {/* Daily breakdown */}
                {daysLeft > 0 && goal.current_amount < goal.target_amount && (
                  <div
                    className="mt-4 pt-4 border-t"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p
                          className="text-lg font-semibold"
                          style={{ color: "var(--color-ink)" }}
                        >
                          {formatCurrency(dailyTarget)}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-muted)" }}
                        >
                          per day
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-lg font-semibold"
                          style={{ color: "var(--color-ink)" }}
                        >
                          {formatCurrency(dailyTarget * 7)}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-muted)" }}
                        >
                          per week
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-lg font-semibold"
                          style={{ color: "var(--color-ink)" }}
                        >
                          {daysLeft}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-muted)" }}
                        >
                          days left
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Goal form modal */}
      <Modal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title={editingGoal ? "Edit goal" : "New savings goal"}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Goal name</label>
            <input
              className="input"
              placeholder="e.g. Emergency fund"
              value={goalForm.name}
              onChange={(e) =>
                setGoalForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Target amount (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={goalForm.target_amount}
              onChange={(e) =>
                setGoalForm((f) => ({ ...f, target_amount: e.target.value }))
              }
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="label">Target date</label>
            <input
              type="date"
              className="input"
              value={goalForm.target_date}
              onChange={(e) =>
                setGoalForm((f) => ({ ...f, target_date: e.target.value }))
              }
            />
          </div>
          {goalError && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {goalError}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => setGoalModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSaveGoal}
              disabled={goalSaving}
            >
              {goalSaving
                ? "Saving…"
                : editingGoal
                  ? "Save changes"
                  : "Create goal"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Contribute modal */}
      <Modal
        open={!!contributeGoal}
        onClose={() => setContributeGoal(null)}
        title={`Add savings — ${contributeGoal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Amount (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              min="0"
              step="1"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => setContributeGoal(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleContribute}
              disabled={contributing}
            >
              {contributing ? "Saving…" : "Add"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
