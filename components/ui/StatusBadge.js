"use client";

import React from "react";
import { getStatusStyle } from "../../lib/utils";

export default function StatusBadge({ status, size = "md", showDot = true }) {
  if (!status) return null;
  const style = getStatusStyle(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size] || "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            style.text.replace("text-", "bg-")
          }`}
        />
      )}
      {status}
    </span>
  );
}
