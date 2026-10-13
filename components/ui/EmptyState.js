"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = "No records found",
  description = "There are no items matching your criteria or search filters.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#F8F6F1] border border-[#E9E4DB] flex items-center justify-center text-[#B96F45] mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#292824]">{title}</h3>
      <p className="mt-1 text-xs text-[#77746E] max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-lg shadow-sm transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
