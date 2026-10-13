"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  FileText,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  RefreshCw,
  Ban,
} from "lucide-react";
import StatusBadge from "../../../../components/ui/StatusBadge";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import DocumentPreviewModal from "../../../../components/ui/DocumentPreviewModal";
import { useAdmin } from "../../../../context/AdminContext";
import { formatDate, formatDateTime } from "../../../../lib/utils";
import { FEATURE_MODULES } from "../../../../lib/constants";

export default function PartnerDetailsPage({ params }) {
  // Unwrap Next.js 16 params
  const resolvedParams = use(params);
  const partnerId = resolvedParams.id;

  const {
    partners,
    salons,
    branches,
    logs,
    approvePartner,
    rejectPartner,
    suspendPartner,
    reactivatePartner,
    updateDocumentStatus,
    requestResubmission,
    addToast,
  } = useAdmin();

  // Find partner
  const partner = partners.find((p) => p.id === partnerId);

  // Modals
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null, // "approve" | "reject" | "suspend" | "reactivate" | "requestDocs"
  });

  const [previewDoc, setPreviewDoc] = useState(null);

  if (!partner) {
    return (
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-12 text-center max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-[#292824]">Partner Not Found</h3>
        <p className="text-xs text-[#77746E] mt-1">
          No partner record found with identifier <span className="font-mono">{partnerId}</span>.
        </p>
        <Link
          href="/admin/partners"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] rounded-xl hover:bg-[#9F5935]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Partners</span>
        </Link>
      </div>
    );
  }

  // Related data
  const partnerSalons = salons.filter((s) => s.partnerId === partner.id);
  const partnerBranches = branches.filter((b) => b.salonId === partnerSalons[0]?.id);
  const partnerLogs = logs.filter(
    (l) => l.target.includes(partner.name) || l.target.includes(partner.id)
  );

  const handleConfirmAction = (reason) => {
    switch (modalState.action) {
      case "approve":
        approvePartner(partner.id);
        break;
      case "reject":
        rejectPartner(partner.id, reason || "Documentation requirements failed");
        break;
      case "suspend":
        suspendPartner(partner.id, reason || "Administrative sanction");
        break;
      case "reactivate":
        reactivatePartner(partner.id);
        break;
      case "requestDocs":
        addToast(`Additional documents requested from ${partner.name}. Notification dispatched.`, "info");
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/partners"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77746E] hover:text-[#292824] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Partners List</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/permissions?partner=${partner.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] rounded-xl hover:bg-[#F8F6F1] transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#B96F45]" />
            <span>Manage Permissions</span>
          </Link>

          {partner.verificationStatus !== "Approved" && (
            <button
              type="button"
              onClick={() => setModalState({ isOpen: true, action: "approve" })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#23533E] rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Partner</span>
            </button>
          )}

          {partner.verificationStatus !== "Rejected" && partner.verificationStatus !== "Approved" && (
            <button
              type="button"
              onClick={() => setModalState({ isOpen: true, action: "reject" })}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B3392E] bg-[#FDECEB] border border-[#F7C2BE] rounded-xl hover:bg-[#FCD8D5] transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Application</span>
            </button>
          )}

          {partner.accountStatus === "Active" ? (
            <button
              type="button"
              onClick={() => setModalState({ isOpen: true, action: "suspend" })}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B3392E] bg-white border border-[#E9E4DB] rounded-xl hover:bg-[#FDECEB] transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Suspend</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModalState({ isOpen: true, action: "reactivate" })}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2D6A4F] bg-[#EBF5EE] border border-[#C6E2D0] rounded-xl hover:bg-[#DCEDE2] transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Reactivate</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B96F45] to-[#9F5935] text-white font-serif font-black text-2xl flex items-center justify-center shrink-0 shadow-md border border-[#A75F36]">
              {partner.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#292824]">
                  {partner.name}
                </h1>
                <StatusBadge status={partner.verificationStatus} size="md" />
                <StatusBadge status={partner.accountStatus} size="md" />
              </div>

              <p className="text-sm font-semibold text-[#B96F45] mt-1">
                {partner.businessName}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#77746E]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#B96F45]" />
                  {partner.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#B96F45]" />
                  {partner.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B96F45]" />
                  {partner.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#B96F45]" />
                  Registered {formatDate(partner.registrationDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-[#F3EFE8] pt-4 md:pt-0 md:pl-6 shrink-0 text-center">
            <div className="px-3">
              <span className="text-[11px] text-[#77746E] uppercase font-bold block">
                Branches
              </span>
              <span className="text-xl font-bold text-[#292824] mt-0.5 block">
                {partner.branchCount}
              </span>
            </div>
            <div className="px-3">
              <span className="text-[11px] text-[#77746E] uppercase font-bold block">
                Bookings
              </span>
              <span className="text-xl font-bold text-[#292824] mt-0.5 block">
                {partner.totalBookings}
              </span>
            </div>
            <div className="px-3">
              <span className="text-[11px] text-[#77746E] uppercase font-bold block">
                Rating
              </span>
              <span className="text-xl font-bold text-[#B96F45] mt-0.5 block">
                ⭐ {partner.rating}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Documents on Left, Features & Branches on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Submitted Documents & Verification Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E9E4DB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#292824]">
                  Submitted Verification Documents ({partner.documents?.length || 0})
                </h3>
                <p className="text-xs text-[#77746E] mt-0.5">
                  Government IDs, business proofs, and premises photos
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalState({ isOpen: true, action: "requestDocs" })}
                className="text-xs font-semibold text-[#B96F45] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Request Additional Docs</span>
              </button>
            </div>

            <div className="divide-y divide-[#F3EFE8]">
              {partner.documents?.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F5] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F6ECE5] border border-[#EBD4C6] text-[#B96F45] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#292824]">{doc.name}</span>
                        <StatusBadge status={doc.status} size="sm" />
                      </div>
                      <span className="text-[11px] text-[#77746E] block mt-0.5">
                        {doc.type} • {doc.size} • Submitted {formatDate(doc.submittedDate)}
                      </span>
                      {doc.reviewNotes && (
                        <p className="mt-1.5 text-[11px] text-[#9A6700] bg-[#FEF6E9] border border-[#F7E1B5] px-2 py-1 rounded-md inline-block">
                          Note: {doc.reviewNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] rounded-lg hover:bg-[#F8F6F1] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#B96F45]" />
                      <span>Inspect Document</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salons & Branch Summary */}
          <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs p-5">
            <h3 className="text-sm font-bold text-[#292824] mb-3">
              Associated Salons & Physical Outlets ({partnerBranches.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partnerBranches.map((br) => (
                <div
                  key={br.id}
                  className="p-3.5 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB] text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-[#292824]">
                    <span>{br.name}</span>
                    <StatusBadge status={br.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-[#77746E] mt-1">{br.address}</p>
                  <div className="mt-2.5 pt-2 border-t border-[#E9E4DB] flex items-center justify-between text-[11px] text-[#77746E]">
                    <span>Manager: <strong className="text-[#292824]">{br.managerName}</strong></span>
                    <span>Staff: {br.staffCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Feature Permissions & Activity Log */}
        <div className="space-y-6">
          {/* Enabled Feature Modules */}
          <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E4DB] mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#292824]">Enabled Features</h3>
                <p className="text-[11px] text-[#77746E]">Active feature modules</p>
              </div>
              <Link
                href={`/admin/permissions?partner=${partner.id}`}
                className="text-xs font-semibold text-[#B96F45] hover:underline"
              >
                Edit
              </Link>
            </div>

            <div className="space-y-2">
              {FEATURE_MODULES.map((mod) => {
                const isEnabled = !!partner.enabledFeatures?.[mod.key];
                return (
                  <div
                    key={mod.key}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs"
                  >
                    <span className="text-[#54514B] font-medium">{mod.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isEnabled
                          ? "bg-[#EBF5EE] text-[#2D6A4F] border border-[#C6E2D0]"
                          : "bg-[#F2EFE9] text-[#77746E] border border-[#E1DDD4]"
                      }`}
                    >
                      {isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Partner Audit Trail */}
          <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs p-5">
            <h3 className="text-sm font-bold text-[#292824] mb-3">
              Administrative History
            </h3>
            <div className="space-y-3 text-xs">
              {partnerLogs.length > 0 ? (
                partnerLogs.map((l) => (
                  <div key={l.id} className="pb-2.5 border-b border-[#F3EFE8] last:border-0 last:pb-0">
                    <p className="font-semibold text-[#292824]">{l.action}</p>
                    <p className="text-[11px] text-[#77746E] mt-0.5">{l.details}</p>
                    <span className="text-[10px] text-[#A09D96] block mt-1">
                      {formatDateTime(l.timestamp)} • {l.actor}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#77746E]">
                  Registered on {formatDate(partner.registrationDate)}. No recent sanctions recorded.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        type={
          modalState.action === "reject" || modalState.action === "suspend"
            ? "danger"
            : "success"
        }
        title={
          modalState.action === "approve"
            ? `Approve ${partner.name}?`
            : modalState.action === "reject"
            ? `Reject ${partner.name}?`
            : modalState.action === "suspend"
            ? `Suspend ${partner.name}?`
            : modalState.action === "reactivate"
            ? `Reactivate ${partner.name}?`
            : `Request Additional Documents?`
        }
        message={
          modalState.action === "approve"
            ? `Approving ${partner.name} validates their KYC, enables their salon profile on The Salon Times customer app, and issues official onboarding credentials.`
            : modalState.action === "reject"
            ? `Rejecting this application will notify ${partner.name} and archive their onboarding record.`
            : modalState.action === "suspend"
            ? `Suspending will hide all branches and services of ${partner.businessName} from search results.`
            : modalState.action === "reactivate"
            ? `Reactivating will restore normal visibility.`
            : `An email and in-app prompt will be sent asking the partner to upload updated certificates.`
        }
        confirmText={
          modalState.action === "approve"
            ? "Confirm Approval"
            : modalState.action === "reject"
            ? "Confirm Rejection"
            : modalState.action === "suspend"
            ? "Confirm Suspension"
            : modalState.action === "reactivate"
            ? "Confirm Reactivation"
            : "Send Request"
        }
        requiresReason={
          modalState.action === "reject" ||
          modalState.action === "suspend" ||
          modalState.action === "requestDocs"
        }
        reasonPlaceholder="Provide administrative notes or specific missing document details..."
      />

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          partner={partner}
          onApprove={(pId, dId, notes) => updateDocumentStatus(pId, dId, "Approved", notes)}
          onReject={(pId, dId, notes) => updateDocumentStatus(pId, dId, "Rejected", notes)}
          onRequestResubmission={(pId, dId, notes) => requestResubmission(pId, dId, notes)}
        />
      )}
    </div>
  );
}
