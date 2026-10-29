"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Download,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import StatusBadge from "../ui/StatusBadge";
import { formatDate, formatDateTime } from "../../lib/utils";

export default function PartnerReviewDrawer({
  isOpen,
  onClose,
  partner,
  onApprove,
  onReject,
  onPendingReview,
  onUpdateDocStatus,
}) {
  const [activePreviewDoc, setActivePreviewDoc] = useState(null);
  const [docNotes, setDocNotes] = useState({});

  if (!isOpen || !partner) return null;

  const isApproved = partner.verificationStatus === "Approved";
  const isRejected = partner.verificationStatus === "Rejected";
  const isPending =
    partner.verificationStatus === "Pending" ||
    partner.verificationStatus === "Under Review";

  const handleToggleDocPreview = (docId) => {
    setActivePreviewDoc((prev) => (prev === docId ? null : docId));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-[#E9E4DB] animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-[#FAF9F5] border-b border-[#E9E4DB] flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B96F45] to-[#9F5935] text-white flex items-center justify-center font-serif font-black text-xl shadow-md border border-[#A75F36] shrink-0">
                {partner.name
                  ? partner.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "PT"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-lg font-bold text-[#292824] leading-tight">
                    {partner.businessName || partner.name}
                  </h2>
                  <StatusBadge status={partner.verificationStatus} size="sm" />
                </div>
                <p className="text-xs text-[#77746E]">
                  Legal Entity: <span className="font-semibold text-[#292824]">{partner.legalName || partner.name}</span> • UID: <span className="font-mono text-[11px] text-[#A09D96]">{partner.id}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#77746E] hover:text-[#292824] hover:bg-[#E9E4DB] transition-colors"
              title="Close Application Dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Rejection Alert Banner (if rejected) */}
            {isRejected && partner.rejectionReason && (
              <div className="p-4 rounded-2xl bg-[#FDECEB] border border-[#F7C2BE] text-xs text-[#B3392E] flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">
                    Application Rejection Reason Recorded
                  </span>
                  <p className="text-[#84231A] leading-relaxed">
                    {partner.rejectionReason}
                  </p>
                  {partner.reviewedBy && (
                    <span className="block mt-1.5 text-[11px] text-[#A63529]">
                      Reviewed by {partner.reviewerEmail || partner.reviewedBy} on {formatDateTime(partner.reviewedAt)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Approved Alert Banner (if approved) */}
            {isApproved && (
              <div className="p-4 rounded-2xl bg-[#EBF5EE] border border-[#C6E2D0] text-xs text-[#2D6A4F] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">
                    Verified & Operating Partner
                  </span>
                  <p className="text-[#1E4835] leading-relaxed">
                    All submitted verification proofs and licenses have been verified. Partner has full access to publish salons and accept customer bookings.
                  </p>
                  {partner.reviewedBy && (
                    <span className="block mt-1.5 text-[11px] text-[#2D6A4F]">
                      Approved by {partner.reviewerEmail || partner.reviewedBy} on {formatDateTime(partner.reviewedAt)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Section 1: Business Identity Grid */}
            <div className="bg-[#FAF9F5] rounded-2xl border border-[#E9E4DB] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E9E4DB] pb-3">
                <Building className="w-4 h-4 text-[#B96F45]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#292824]">
                  Registered Business Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#77746E] block mb-0.5">Trade / Salon Name</span>
                  <span className="font-bold text-[#292824] text-sm block">
                    {partner.businessName || "Not Provided"}
                  </span>
                </div>

                <div>
                  <span className="text-[#77746E] block mb-0.5">Legal Owner / Proprietor</span>
                  <span className="font-bold text-[#292824] text-sm block">
                    {partner.legalName || partner.name}
                  </span>
                </div>

                <div>
                  <span className="text-[#77746E] block mb-0.5">Business Constitution Type</span>
                  <span className="font-semibold text-[#292824] block">
                    {partner.businessType || "Proprietorship"}
                  </span>
                </div>

                <div>
                  <span className="text-[#77746E] block mb-0.5">Registration / GST / License No.</span>
                  <span className="font-mono font-bold text-[#B96F45] block">
                    {partner.regNumber || "Pending Submission"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="bg-white rounded-2xl border border-[#E9E4DB] p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#F3EFE8] pb-3">
                <User className="w-4 h-4 text-[#B96F45]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#292824]">
                  Applicant Contact & Location
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#77746E] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#77746E] block text-[11px]">Contact Mobile</span>
                    <a
                      href={`tel:${partner.phone}`}
                      className="font-semibold text-[#292824] hover:text-[#B96F45] hover:underline"
                    >
                      {partner.phone || "No phone provided"}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#77746E] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#77746E] block text-[11px]">Work Email Address</span>
                    <a
                      href={`mailto:${partner.email}`}
                      className="font-semibold text-[#292824] hover:text-[#B96F45] hover:underline break-all"
                    >
                      {partner.email || "No email provided"}
                    </a>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-start gap-2.5 pt-2 border-t border-[#F3EFE8]">
                  <MapPin className="w-4 h-4 text-[#B96F45] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#77746E] block text-[11px]">Salon Physical Street Address</span>
                    <p className="font-medium text-[#292824] leading-relaxed">
                      {partner.businessAddress || "No physical address provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#77746E]">
                  <Calendar className="w-3.5 h-3.5 text-[#B96F45]" />
                  <span>Submitted: {formatDateTime(partner.submittedAt)}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Verification Documents Dossier */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#B96F45]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#292824]">
                    Submitted Verification Documents ({partner.documents?.length || 0})
                  </h3>
                </div>
                <span className="text-[11px] text-[#77746E]">
                  Click document to inspect details
                </span>
              </div>

              {(!partner.documents || partner.documents.length === 0) ? (
                <div className="p-8 rounded-2xl bg-[#FAF9F5] border border-[#E9E4DB] text-center">
                  <FileText className="w-8 h-8 text-[#A09D96] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#292824]">
                    No documents attached yet
                  </p>
                  <p className="text-[11px] text-[#77746E] mt-0.5">
                    The partner has registered their profile but has not yet uploaded identity or license proofs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {partner.documents.map((doc, idx) => {
                    const isPreviewing = activePreviewDoc === doc.id;
                    const isImage =
                      doc.fileUrl &&
                      (doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ||
                        doc.fileName?.match(/\.(jpeg|jpg|gif|png|webp)/i));

                    return (
                      <div
                        key={doc.id || idx}
                        className="rounded-2xl border border-[#E9E4DB] bg-white shadow-xs overflow-hidden transition-all"
                      >
                        {/* Doc Item Header */}
                        <div className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#F6ECE5] border border-[#EBD4C6] flex items-center justify-center text-[#B96F45] shrink-0 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h4 className="text-xs font-bold text-[#292824] truncate">
                                  {doc.documentType || doc.type}
                                </h4>
                                <StatusBadge status={doc.status} size="sm" />
                              </div>
                              <p className="text-[11px] text-[#77746E] truncate">
                                File: <span className="font-mono text-[#292824]">{doc.fileName || doc.name}</span>
                                {doc.size && ` • ${doc.size}`}
                                {doc.documentNumber && ` • No: ${doc.documentNumber}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {doc.fileUrl && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDocPreview(doc.id)}
                                  className="p-1.5 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F8F6F1] transition-colors"
                                  title={isPreviewing ? "Hide Preview" : "Quick Preview"}
                                >
                                  {isPreviewing ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#B96F45] bg-[#F6ECE5] hover:bg-[#EBD4C6] rounded-lg transition-colors"
                                  title="Open secure original file in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open File</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expandable Preview Canvas */}
                        {isPreviewing && (
                          <div className="p-4 border-t border-[#F3EFE8] bg-[#FAF9F5]">
                            {isImage ? (
                              <div className="relative rounded-xl overflow-hidden border border-[#E9E4DB] bg-white text-center p-2">
                                <img
                                  src={doc.fileUrl}
                                  alt={doc.documentType}
                                  className="max-h-72 w-auto mx-auto rounded-lg object-contain"
                                />
                              </div>
                            ) : (
                              <div className="p-6 rounded-xl border border-[#E9E4DB] bg-white text-center space-y-3">
                                <FileText className="w-10 h-10 text-[#B96F45] mx-auto" />
                                <div>
                                  <p className="text-xs font-bold text-[#292824]">
                                    {doc.fileName || "Document File"}
                                  </p>
                                  <p className="text-[11px] text-[#77746E] mt-0.5">
                                    Secure document hosted on Firebase Storage. Click below to inspect.
                                  </p>
                                </div>
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-xl shadow-xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open Document in Dedicated Viewer</span>
                                </a>
                              </div>
                            )}

                            {/* Review Note for this document */}
                            {onUpdateDocStatus && (
                              <div className="mt-3 pt-3 border-t border-[#E9E4DB] flex items-center justify-between gap-2 text-xs">
                                <span className="text-[#77746E]">Individual document check:</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateDocStatus(partner.id, doc.id, "approved", "Document validated")}
                                    className="px-2.5 py-1 rounded-lg font-semibold bg-[#EBF5EE] text-[#2D6A4F] hover:bg-[#D4EBDC] transition-colors"
                                  >
                                    Approve Doc
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateDocStatus(partner.id, doc.id, "rejected", "Illegible or expired document")}
                                    className="px-2.5 py-1 rounded-lg font-semibold bg-[#FDECEB] text-[#B3392E] hover:bg-[#F9D4D0] transition-colors"
                                  >
                                    Reject Doc
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-5 bg-white border-t border-[#E9E4DB] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#54514B] bg-[#F8F6F1] hover:bg-[#E9E4DB] rounded-xl transition-colors cursor-pointer"
            >
              Close Dossier
            </button>

            <div className="flex items-center gap-2">
              {/* Mark Under Review (if not already under review) */}
              {partner.verificationStatus !== "Under Review" && (
                <button
                  type="button"
                  onClick={() => onPendingReview(partner.id)}
                  className="px-3.5 py-2.5 text-xs font-semibold text-[#9A6700] bg-[#FEF6E9] hover:bg-[#FBE8C4] border border-[#F7E1B5] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mark Under Review</span>
                </button>
              )}

              {/* Reject Action */}
              <button
                type="button"
                onClick={() => onReject(partner)}
                className="px-4 py-2.5 text-xs font-semibold text-[#B3392E] bg-[#FDECEB] hover:bg-[#F9D4D0] border border-[#F7C2BE] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Application</span>
              </button>

              {/* Approve Action */}
              <button
                type="button"
                onClick={() => onApprove(partner)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#23533E] rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Partner</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

