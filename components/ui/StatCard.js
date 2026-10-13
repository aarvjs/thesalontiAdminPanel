"use client";

import React from "react";

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendType = "neutral",
  badge,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E9E4DB] p-5 shadow-[0_2px_8px_rgba(41,40,36,0.03)] hover:shadow-[0_4px_16px_rgba(41,40,36,0.06)] transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#77746E]">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-[#292824] mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#F6ECE5] text-[#B96F45] flex items-center justify-center shrink-0 border border-[#EBD4C6]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-[#F3EFE8] flex items-center justify-between text-xs">
        <p className="text-[#77746E] line-clamp-1">{description}</p>
        {trend && (
          <span
            className={`font-semibold shrink-0 ml-2 ${
              trendType === "positive"
                ? "text-[#2D6A4F]"
                : trendType === "negative"
                ? "text-[#B3392E]"
                : "text-[#B96F45]"
            }`}
          >
            {trend}
          </span>
        )}
        {badge && (
          <span className="shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF6E9] text-[#9A6700] border border-[#F7E1B5]">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
