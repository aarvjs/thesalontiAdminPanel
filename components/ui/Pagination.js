"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E9E4DB] bg-white text-xs text-[#77746E]">
      <div>
        Showing <span className="font-semibold text-[#292824]">{startItem}</span> to{" "}
        <span className="font-semibold text-[#292824]">{endItem}</span> of{" "}
        <span className="font-semibold text-[#292824]">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-[#E9E4DB] bg-white text-[#292824] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F6F1] transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
              currentPage === page
                ? "bg-[#B96F45] text-white shadow-sm"
                : "border border-[#E9E4DB] bg-white text-[#292824] hover:bg-[#F8F6F1]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-[#E9E4DB] bg-white text-[#292824] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F6F1] transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
