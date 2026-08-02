"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Category } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";

const TYPES = ["all", "expense", "income"] as const;

export default function ExpensesPage() {
  const supabase = createClient();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Form state
  const [form, setForm] = useState({
    amount: "",
    description: "",
    transaction_date: format(new Date(), "yyyy-MM-dd"),
    type: "expense" as "expense" | "income",
    category_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: txns }, { data: cats }] = await Promise.all([
      supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    setTransactions(txns ?? []);
    setCategories(cats ?? []);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAdd() {
    setEditing(null);
    setForm({
      amount: "",
      description: "",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      type: "expense",
      category_id: "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setForm({
      amount: String(t.amount),
      description: t.description,
      transaction_date: t.transaction_date,
      type: t.type,
      category_id: t.category_id ?? "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setFormError("Please enter a valid amount.");
      return;
    }
    setSaving(true);
    setFormError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user!.id,
      amount: Number(form.amount),
      description: form.description,
      transaction_date: form.transaction_date,
      type: form.type,
      category_id: form.category_id || null,
      source: "manual",
    };

    console.log("Payload:", payload);

    try {
      const rpcResult = await supabase.rpc("debug_auth");
      console.log("RPC RESULT:", rpcResult);
    } catch (e) {
      console.error("RPC FAILED", e);
    }

    const { error } = editing
      ? await supabase.from("transactions").update(payload).eq("id", editing.id)
      : await supabase.from("transactions").insert(payload);

    if (error) {
      setFormError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    fetchData();
  }

  // Filtered list
  const filtered = transactions.filter((t) => {
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.name?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const filteredCats = categories.filter((c) => c.type === form.type);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Track your income and spending"
        action={
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-muted)" }}
          />
          <input
            className="input pl-8"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "var(--color-subtle)" }}
        >
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="btn px-3 py-1 text-xs capitalize"
              style={
                typeFilter === t
                  ? {
                      background: "white",
                      color: "var(--color-ink)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }
                  : { background: "transparent", color: "var(--color-muted)" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card h-16 animate-pulse"
              style={{ background: "var(--color-subtle)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No transactions yet"
          description="Add your first income or expense to start tracking."
          action={
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={14} /> Add transaction
            </button>
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <ul
            className="divide-y"
            style={{ borderColor: "var(--color-border)" }}
          >
            {filtered.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-subtle)] transition-colors group"
              >
                {/* Icon */}
                <span className="text-xl w-8 text-center shrink-0">
                  {t.category?.icon ?? (t.type === "income" ? "💵" : "📦")}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {t.description || t.category?.name || "—"}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {t.category?.name && t.description
                      ? `${t.category.name} · `
                      : ""}
                    {formatDate(t.transaction_date)}
                    {t.source === "subscription" && (
                      <span
                        className="ml-1.5 px-1.5 py-0.5 rounded text-xs"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent)",
                        }}
                      >
                        recurring
                      </span>
                    )}
                  </p>
                </div>

                {/* Amount */}
                <span
                  className="text-sm font-semibold tabular-nums shrink-0"
                  style={{
                    color:
                      t.type === "income"
                        ? "var(--color-success)"
                        : "var(--color-ink)",
                  }}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </span>

                {/* Actions — only show for manual entries */}
                {t.source === "manual" && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEdit(t)}
                      className="btn btn-ghost p-1.5 rounded"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="btn btn-ghost p-1.5 rounded"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit transaction" : "Add transaction"}
      >
        <div className="space-y-4 max-h-[calc(100dvh-180px)] overflow-y-auto pb-24">
          {/* Type toggle */}
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setForm((f) => ({ ...f, type: t, category_id: "" }))
                  }
                  className="btn flex-1 capitalize"
                  style={
                    form.type === t
                      ? { background: "var(--color-accent)", color: "white" }
                      : {
                          background: "var(--color-subtle)",
                          color: "var(--color-ink-2)",
                          border: "1px solid var(--color-border)",
                        }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
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
            <label className="label">Description</label>
            <input
              type="text"
              className="input"
              placeholder="What was this for?"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
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
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.transaction_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, transaction_date: e.target.value }))
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
