"use client";

import { useState } from "react";
import { isYearOnly } from "@/lib/dateUtils";

interface Props {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export default function FlexibleDateInput({ id, label, value, onChange }: Props) {
  const [yearOnlyMode, setYearOnlyMode] = useState(() => isYearOnly(value));

  const toggle = () => {
    setYearOnlyMode((prev) => !prev);
    onChange(null);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-stone-700">
          {label}
        </label>
        <button
          type="button"
          onClick={toggle}
          className="text-xs text-amber-700 underline hover:text-amber-900"
        >
          {yearOnlyMode ? "יש לי תאריך מדויק" : "רק השנה ידועה"}
        </button>
      </div>
      {yearOnlyMode ? (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder="לדוגמה: 1935"
          min={1800}
          max={CURRENT_YEAR}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
        />
      ) : (
        <input
          id={id}
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
        />
      )}
    </div>
  );
}
