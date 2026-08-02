"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Subscription, Category, BillingCycle } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";

const CYCLES: BillingCycle[] = ["weekly", "monthly", "yearly"];

export default function SubscriptionsPage() {
  const supabase = createClient();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category_id: "",
    billing_cycle: "monthly" as BillingCycle,
    next_billing_date: format(new Date(), "yyyy-MM-dd"),
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: subData }, { data: catData }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*, category:categories(*)")
        .eq("is_active", true)
        .order("next_billing_date", { ascending: true }),
      supabase
        .from("categories")
        .select("*")
        .eq("type", "expense")
        .order("name"),
    ]);
    setSubs(subData ?? []);
    setCategories(catData ?? []);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      amount: "",
      category_id: "",
      billing_cycle: "monthly",
      next_billing_date: format(new Date(), "yyyy-MM-dd"),
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(s: Subscription) {
    setEditing(s);
    setForm({
      name: s.name,
      amount: String(s.amount),
      category_id: s.category_id ?? "",
      billing_cycle: s.billing_cycle,
      next_billing_date: s.next_billing_date,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormError("You must be logged in.");
      return;
    }
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setFormError("");

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      amount: Number(form.amount),
      category_id: form.category_id || null,
      billing_cycle: form.billing_cycle,
      next_billing_date: form.next_billing_date,
    };

    if (editing) {
      await supabase.from("subscriptions").update(payload).eq("id", editing.id);
    } else {
      await supabase
        .from("subscriptions")
        .insert({ ...payload, start_date: form.next_billing_date });
    }

    setSaving(false);
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (
      !confirm("Delete this subscription? This won't remove past transactions.")
    )
      return;
    await supabase.from("subscriptions").delete().eq("id", id);
    fetchData();
  }

  // Monthly cost estimate
  const monthlyTotal = subs.reduce((sum, s) => {
    const monthly =
      s.billing_cycle === "weekly"
        ? (s.amount * 52) / 12
        : s.billing_cycle === "yearly"
          ? s.amount / 12
          : s.amount;
    return sum + monthly;
  }, 0);

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle={`${subs.length} active · ~${formatCurrency(monthlyTotal)}/mo`}
        action={
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add
          </button>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card h-20 animate-pulse"
              style={{ background: "var(--color-subtle)" }}
            />
          ))}
        </div>
      ) : subs.length === 0 ? (
        <EmptyState
          icon="🔄"
          title="No subscriptions"
          description="Add your recurring bills and subscriptions to track them automatically."
          action={
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={14} /> Add subscription
            </button>
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <ul
            className="divide-y"
            style={{ borderColor: "var(--color-border)" }}
          >
            {subs.map((s) => {
              const monthlyEst =
                s.billing_cycle === "weekly"
                  ? (s.amount * 52) / 12
                  : s.billing_cycle === "yearly"
                    ? s.amount / 12
                    : s.amount;

              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-subtle)] transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ background: "var(--color-subtle)" }}
                  >
                    {s.category?.icon ?? "📦"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {s.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded capitalize"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent-dark)",
                        }}
                      >
                        {s.billing_cycle}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-muted)" }}
                      >
                        Next: {formatDate(s.next_billing_date)}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {formatCurrency(s.amount)}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-muted)" }}
                    >
                      ~{formatCurrency(monthlyEst)}/mo
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="btn btn-ghost p-1.5 rounded"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="btn btn-ghost p-1.5 rounded"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit subscription" : "Add subscription"}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="e.g. Netflix"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Amount (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="label">Billing cycle</label>
            <div className="flex gap-2">
              {CYCLES.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, billing_cycle: c }))}
                  className="btn flex-1 capitalize text-sm"
                  style={
                    form.billing_cycle === c
                      ? { background: "var(--color-accent)", color: "white" }
                      : {
                          background: "var(--color-subtle)",
                          color: "var(--color-ink-2)",
                          border: "1px solid var(--color-border)",
                        }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: e.target.value }))
              }
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Next billing date</label>
            <input
              type="date"
              className="input"
              value={form.next_billing_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, next_billing_date: e.target.value }))
              }
            />
          </div>

          {formError && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {formError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
