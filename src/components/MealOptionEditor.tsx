"use client";

import { useEffect, useState } from "react";
import { SLOT_META } from "@/lib/plan";
import type { CustomMealOption } from "@/lib/types";
import { IconClose, IconTrash } from "./icons";

/**
 * Create/edit sheet for a custom meal option. `onDelete` is omitted for a
 * brand-new draft, which has nothing to delete yet.
 */
export default function MealOptionEditor({
  draft,
  isNew,
  onSave,
  onDelete,
  onClose,
}: {
  draft: CustomMealOption;
  isNew: boolean;
  onSave: (option: CustomMealOption) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(draft.label);
  const [items, setItems] = useState(draft.items.join("\n"));
  const [kcal, setKcal] = useState(draft.kcal ? String(draft.kcal) : "");
  const [protein, setProtein] = useState(draft.protein ? String(draft.protein) : "");
  const [portion, setPortion] = useState(draft.portion);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Close on Escape so the sheet behaves like a dialog on desktop too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const num = (v: string) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const valid = label.trim().length > 0 && num(kcal) > 0;

  const save = () => {
    if (!valid) return;
    onSave({
      ...draft,
      label: label.trim(),
      items: items
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean),
      kcal: Math.round(num(kcal)),
      protein: Math.round(num(protein) * 10) / 10,
      portion: portion.trim() || "1 serving",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgb(0 0 0 / 0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "Create meal" : "Edit meal"}
    >
      <div
        className="animate-rise max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        style={{ background: "var(--bg-elevated)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-pill"
          style={{ background: "var(--border-strong)" }}
        />

        <div className="mb-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight">
              {isNew ? "New meal" : "Edit meal"}
            </h2>
            <p className="text-xs text-ink-faint">
              {SLOT_META[draft.slot].label} · {draft.track === "loss" ? "Loss" : "Gain"} plan
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="btn btn-ghost !p-2">
            <IconClose width={16} height={16} />
          </button>
        </div>

        <div className="space-y-3.5">
          <Field label="Meal name" required>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2 chapati + paneer bhurji + salad"
              autoFocus
              className="field"
            />
          </Field>

          <Field label="Ingredients" hint="One per line — shown as chips on the meal screen">
            <textarea
              rows={4}
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder={"2 chapati\n100 g paneer\nGreen salad"}
              className="field resize-none text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories" required>
              <span className="relative block">
                <input
                  type="number"
                  inputMode="decimal"
                  value={kcal}
                  onChange={(e) => setKcal(e.target.value)}
                  placeholder="0"
                  className="field num pr-11 font-bold"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-faint">
                  kcal
                </span>
              </span>
            </Field>
            <Field label="Protein">
              <span className="relative block">
                <input
                  type="number"
                  inputMode="decimal"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="field num pr-8 font-bold"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-faint">
                  g
                </span>
              </span>
            </Field>
          </div>

          <Field label="Portion" hint="How much one serving is">
            <input
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              placeholder="1 plate"
              className="field"
            />
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={save} disabled={!valid} className="btn btn-primary flex-[2]">
            {isNew ? "Add meal" : "Save changes"}
          </button>
        </div>

        {!valid && (label.trim() || kcal) && (
          <p className="mt-2 text-center text-xs text-ink-faint">
            A name and a calorie value are required.
          </p>
        )}

        {onDelete && (
          <div className="mt-4 border-t border-line pt-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn btn-danger w-full !py-2 !text-xs"
              >
                <IconTrash width={14} height={14} />
                Delete this meal
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs leading-relaxed" style={{ color: "var(--danger)" }}>
                  Remove it from your plan and the meal picker? Days you have already logged keep
                  this meal exactly as recorded.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn btn-ghost flex-1 !py-2 !text-xs"
                  >
                    Keep
                  </button>
                  <button onClick={onDelete} className="btn btn-danger flex-1 !py-2 !text-xs">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
          {label}
        </span>
        {required && (
          <span className="text-[0.72rem] font-semibold" style={{ color: "var(--danger)" }}>
            *
          </span>
        )}
        {hint && <span className="text-[0.68rem] text-ink-faint">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
