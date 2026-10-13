"use client";

import React, { useState } from "react";
import { X, FileText, CheckCircle, AlertTriangle, RefreshCw, Calendar, HardDrive, ShieldCheck } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  partner,
  onApprove,
  onReject,
  onRequestResubmission,
}) {
  const [reviewNotes, setReviewNotes] = useState("");

  if (!isOpen || !document) return null;

  const handleApprove = () => {
    onApprove(partner?.id, document.id, reviewNotes);
    onClose();
  };

  const handleReject = () => {
    onReject(partner?.id, document.id, reviewNotes || "Document unreadable or invalid");
    onClose();
  };

  const handleRequestResubmit = () => {
    onRequestResubmission(partner?.id, document.id, reviewNotes || "Please re-upload a clear scanned copy");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E9E4DB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E4DB] bg-[#F8F6F1]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F6ECE5] border border-[#EBD4C6] flex items-center justify-center text-[#B96F45]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#292824]">{document.name}</h3>
              <p className="text-xs text-[#77746E]">
                {document.type} • Submitted by <span className="font-semibold text-[#292824]">{partner?.name}</span> ({partner?.businessName})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#E9E4DB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status & metadata banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB] text-xs">
            <div>
              <span className="text-[#77746E] block mb-1">Status</span>
              <StatusBadge status={document.status} size="sm" />
            </div>
            <div>
              <span className="text-[#77746E] block mb-1">Submission Date</span>
              <span className="font-semibold text-[#292824] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B96F45]" />
                {document.submittedDate ? new Date(document.submittedDate).toLocaleDateString("en-IN") : "Recent"}
              </span>
            </div>
            <div>
              <span className="text-[#77746E] block mb-1">File Size</span>
              <span className="font-semibold text-[#292824] flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-[#B96F45]" />
                {document.size || "2.4 MB"}
              </span>
            </div>
            <div>
              <span className="text-[#77746E] block mb-1">Security Scan</span>
              <span className="font-semibold text-[#2D6A4F] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Passed
              </span>
            </div>
          </div>

          {/* Visual Document Mock Preview Canvas */}
          <div className="border border-[#E9E4DB] rounded-xl bg-[#FAF9F5] p-6 text-center shadow-inner relative overflow-hidden">
            <div className="max-w-md mx-auto bg-white rounded-lg border border-[#E9E4DB] p-6 shadow-sm text-left relative">
              <div className="flex items-center justify-between border-b border-[#F3EFE8] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#B96F45] text-white flex items-center justify-center text-[10px] font-bold">
                    ST
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#77746E]">
                    Verification Document Record
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#77746E]">{document.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#77746E] block">Document Classification</span>
                  <span className="font-semibold text-[#292824]">{document.type}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#77746E] block">Entity / Business Registered</span>
                  <span className="font-semibold text-[#292824]">{partner?.businessName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#77746E] block">Authorized Signatory</span>
                  <span className="font-semibold text-[#292824]">{partner?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#77746E] block">City Jurisdiction</span>
                  <span className="font-semibold text-[#292824]">{partner?.city}</span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-dashed border-[#E9E4DB] flex items-center justify-between text-[11px] text-[#77746E]">
                <span>Certified Digital Copy</span>
                <span className="text-[#2D6A4F] font-semibold">✓ Format Verified</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-[#77746E]">
              Protected sandbox review environment. Real documents are watermarked upon upload.
            </p>
          </div>

          {/* Current Notes / Reviewer Comments */}
          {document.reviewNotes && (
            <div className="p-3 rounded-lg bg-[#FEF6E9] border border-[#F7E1B5] text-xs text-[#9A6700]">
              <span className="font-bold block mb-0.5">Previous Reviewer Note:</span>
              {document.reviewNotes}
            </div>
          )}

          {/* Review Notes Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#77746E] mb-1.5">
              Review Decision Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="e.g., Verified against government portal, or specify what needs fixing..."
              className="w-full p-2.5 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#E9E4DB] bg-[#F8F6F1] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRequestResubmit}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#9A6700] bg-[#FEF6E9] border border-[#F7E1B5] rounded-lg hover:bg-[#FDF0D5] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Request Resubmission
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#B3392E] bg-[#FDECEB] border border-[#F7C2BE] rounded-lg hover:bg-[#FCD8D5] transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Reject Document
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#23533E] rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
