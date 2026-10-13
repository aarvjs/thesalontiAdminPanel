"use client";

import React from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useAdmin();

  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-[#2D6A4F] shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#9A6700] shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-[#B3392E] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#B96F45] shrink-0" />,
  };

  const borders = {
    success: "border-[#C6E2D0] bg-[#EBF5EE] text-[#1E4D38]",
    warning: "border-[#F7E1B5] bg-[#FEF6E9] text-[#7E5400]",
    error: "border-[#F7C2BE] bg-[#FDECEB] text-[#8C2319]",
    info: "border-[#EBD4C6] bg-[#F6ECE5] text-[#703B1E]",
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg text-xs font-medium animate-in slide-in-from-bottom-3 duration-200 ${
            borders[toast.type] || borders.info
          }`}
        >
          <div className="flex items-center gap-2.5">
            {icons[toast.type] || icons.info}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-md hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
