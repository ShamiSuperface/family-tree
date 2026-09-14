"use client";

import { useState } from "react";
import { isYearOnly, isMonthDayOnly } from "@/lib/dateUtils";

type DateMode = "full" | "year" | "monthday";

function detectMode(value: string | null): DateMode {
  if (isYearOnly(value)) return "year";
  if (isMonthDayOnly(value)) return "monthday";
  return "full";
}

const MODE_LABEL: Record<DateMode, string> = {
  full: "תאריך מלא",
  year: "רק שנה",
  monthday: "רק יום וחודש",
};

const CURRENT_YEAR = new Date().getFullYear();

interface Props {
  id: string;
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Smaller inline styling, for use next to a checkbox (e.g. a spouse row). */
  compact?: boolean;
}

export default function PartialDateInput({ id, label, value, onChange, compact }: Props) {
  const [mode, setMode] = useState<DateMode>(() => detectMode(value));
  const initialParts = mode === "monthday" && value ? value.split("-") : ["", ""];
  // Held locally so typing one of month/day doesn't get wiped while the other
  // is still empty (the combined "MM-DD" value can't represent that state).
  const [month, setMonth] = useState(initialParts[0]);
  const [day, setDay] = useState(initialParts[1]);

  const handleModeChange = (newMode: DateMode) => {
    setMode(newMode);
    setMonth("");
    setDay("");
    onChange(null);
  };

  const updateMonthDay = (newMonth: string, newDay: string) => {
    setMonth(newMonth);
    setDay(newDay);
    onChange(newMonth && newDay ? `${newMonth.padStart(2, "0")}-${newDay.padStart(2, "0")}` : null);
  };

  const inputClass = compact
    ? "rounded border border-amber-200 bg-white px-1.5 py-0.5 text-xs text-stone-900 outline-none focus:border-amber-500"
    : "w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500";
  const selectClass = compact
    ? "rounded border border-amber-200 bg-white px-1 py-0.5 text-xs text-amber-800 outline-none focus:border-amber-500"
    : "rounded border border-amber-200 bg-white px-1.5 py-0.5 text-xs text-amber-800 outline-none focus:border-amber-500";

  const modeSelect = (
    <select
      aria-label={label ? `סוג תאריך: ${label}` : "סוג תאריך"}
      value={mode}
      onChange={(e) => handleModeChange(e.target.value as DateMode)}
      className={selectClass}
    >
      <option value="full">{MODE_LABEL.full}</option>
      <option value="year">{MODE_LABEL.year}</option>
      <option value="monthday">{MODE_LABEL.monthday}</option>
    </select>
  );

  const fields =
    mode === "full" ? (
      <input
        id={id}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={inputClass}
      />
    ) : mode === "year" ? (
      <input
        id={id}
        type="number"
        inputMode="numeric"
        placeholder="לדוגמה: 1935"
        min={1800}
        max={CURRENT_YEAR}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={inputClass}
      />
    ) : (
      <span className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          min={1}
          max={12}
          placeholder="חודש"
          value={month}
          onChange={(e) => updateMonthDay(e.target.value, day)}
          className={compact ? `${inputClass} w-14` : inputClass}
        />
        <span className="text-stone-400">/</span>
        <input
          type="number"
          min={1}
          max={31}
          placeholder="יום"
          value={day}
          onChange={(e) => updateMonthDay(month, e.target.value)}
          className={compact ? `${inputClass} w-14` : inputClass}
        />
      </span>
    );

  if (compact) {
    return (
      <span className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
        {label ? `${label}:` : null}
        {fields}
        {modeSelect}
      </span>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        {modeSelect}
      </div>
      {fields}
    </div>
  );
}
