"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default", // default, danger, success, warning
  requiresReason = false,
  reasonPlaceholder = "Provide an administrative reason...",
}) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
    onClose();
  };

  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-[#B3392E]" />,
    warning: <AlertTriangle className="w-6 h-6 text-[#9A6700]" />,
    success: <CheckCircle className="w-6 h-6 text-[#2D6A4F]" />,
    default: <Info className="w-6 h-6 text-[#B96F45]" />,
  };

  const confirmColors = {
    danger: "bg-[#B3392E] hover:bg-[#972E25] text-white",
    warning: "bg-[#9A6700] hover:bg-[#7E5400] text-white",
    success: "bg-[#2D6A4F] hover:bg-[#23533E] text-white",
    default: "bg-[#B96F45] hover:bg-[#9F5935] text-white",
  }[type] || "bg-[#B96F45] hover:bg-[#9F5935] text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#E9E4DB] shadow-2xl p-6 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F3EFE8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB] shrink-0">
            {icons[type] || icons.default}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#292824]">{title}</h3>
            <p className="mt-1 text-sm text-[#77746E] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {requiresReason && (
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
              Reason / Administrative Notes
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="w-full p-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white transition-all resize-none"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#F3EFE8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#292824] bg-white border border-[#E9E4DB] rounded-lg hover:bg-[#F8F6F1] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${confirmColors}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
