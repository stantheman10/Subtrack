// This is a settings panel embedded in the dashboard header area.
// Kept separate so it can be imported wherever needed.
"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

export default function BudgetSettings({ current }: { current: number }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBudget(String(current || ""));
  }, [current]);

  useEffect(() => {
    supabase
      .from("settings")
      .select("monthly_budget")
      .single()
      .then(({ data }) => {
        if (data) {
          setBudget(String(data.monthly_budget || ""));
        }
      });
  }, []); // eslint-disable-line

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("settings")
      .update({
        monthly_budget: Number(budget) || 0,
        updated_at: new Date().toISOString(),
      })
      .neq("user_id", "00000000-0000-0000-0000-000000000000"); // triggers RLS user match
    setSaving(false);
    setOpen(false);
  }

  return (
    <>
      <button
        className="btn btn-ghost gap-1.5 text-sm"
        onClick={() => setOpen(true)}
      >
        <Settings size={14} />
        {current > 0 ? `Budget: ${formatCurrency(current)}` : "Set budget"}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Monthly budget"
        size="sm"
      >
        <div className="space-y-4 max-h-[calc(100dvh-180px)] overflow-y-auto pb-24">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Set a monthly spending cap to track against on your dashboard.
          </p>
          <div>
            <label className="label">Monthly budget (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 30000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              step="100"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
