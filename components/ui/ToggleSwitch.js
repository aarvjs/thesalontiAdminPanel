"use client";

import React from "react";

export default function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  label,
  description,
  id,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={id}
              className={`text-sm font-semibold ${
                disabled ? "text-[#A09D96]" : "text-[#292824]"
              } cursor-pointer`}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-[#77746E] leading-normal mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#B96F45]/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? "bg-[#B96F45]" : "bg-[#DDD8CF]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
