"use client";

import React from "react";
import { Filter } from "lucide-react";

export default function FilterDropdown({
  value,
  onChange,
  options = [],
  className = "",
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-8 pr-8 py-2 text-sm bg-white border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:ring-2 focus:ring-[#B96F45]/15 transition-all cursor-pointer font-medium"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Filter className="w-3.5 h-3.5 text-[#77746E] absolute left-2.5 pointer-events-none" />
      <div className="absolute right-2.5 pointer-events-none text-[#77746E] text-xs">
        ▼
      </div>
    </div>
  );
}
