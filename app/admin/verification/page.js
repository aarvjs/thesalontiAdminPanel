"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileCheck,
  FileText,
  Eye,
  Clock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Search,
  ExternalLink,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import EmptyState from "../../../components/ui/EmptyState";
import PartnerReviewDrawer from "../../../components/verification/PartnerReviewDrawer";
import { useAdmin } from "../../../context/AdminContext";
import { formatDate, formatDateTime } from "../../../lib/utils";

export default function PartnerVerificationPage() {
  const {
    partners,
    partnersLoading,
    partnersError,
    approvePartner,
    rejectPartner,
    setPendingReview,
    updateDocumentStatus,
    createSamplePartnerApplication,
    addToast,
  } = useAdmin();

  // Search, filter & pagination state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Selected partner for the slide-out dossier review drawer
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  // Confirmation modal state for Approve / Reject actions
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    partner: null,
    action: null, // "approve" | "reject"
    isSubmitting: false,
  });

  // Sample creation loading state
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  // Filtered partners list
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.fullName && p.fullName.toLowerCase().includes(q)) ||
        (p.businessName && p.businessName.toLowerCase().includes(q)) ||
        (p.legalName && p.legalName.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.regNumber && p.regNumber.toLowerCase().includes(q)) ||
        (p.businessAddress && p.businessAddress.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "ALL" ||
        p.verificationStatus === statusFilter ||
        (statusFilter === "Pending" &&
          (p.verificationStatus === "Pending" ||
            p.verificationStatus === "Draft" ||
            p.verificationStatus === "Action Required"));

      return matchSearch && matchStatus;
    });
  }, [partners, search, statusFilter]);

  const totalPages = Math.ceil(filteredPartners.length / pageSize) || 1;
  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Live KPI Summary Metrics directly derived from Firestore
  const totalCount = partners.length;
  const pendingCount = partners.filter(
    (p) =>
      p.verificationStatus === "Pending" ||
      p.verificationStatus === "Under Review" ||
      p.verificationStatus === "Draft" ||
      p.verificationStatus === "Action Required"
  ).length;
  const approvedCount = partners.filter((p) => p.verificationStatus === "Approved").length;
  const rejectedCount = partners.filter((p) => p.verificationStatus === "Rejected").length;

  // Find currently selected partner for the review drawer (keeps live sync if Firestore updates)
  const activePartner = useMemo(() => {
    if (!selectedPartnerId) return null;
    return partners.find((p) => p.id === selectedPartnerId) || null;
  }, [partners, selectedPartnerId]);

  // Action handlers
  const handleOpenApproveModal = (partner) => {
    setConfirmModal({
      isOpen: true,
      partner,
      action: "approve",
      isSubmitting: false,
    });
  };

  const handleOpenRejectModal = (partner) => {
    setConfirmModal({
      isOpen: true,
      partner,
      action: "reject",
      isSubmitting: false,
    });
  };

  const handleConfirmAction = async (reason) => {
    if (!confirmModal.partner) return;
    const { partner, action } = confirmModal;

    setConfirmModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (action === "approve") {
        await approvePartner(partner.id);
      } else if (action === "reject") {
        await rejectPartner(partner.id, reason || "Application requirements not fulfilled.");
      }
      setConfirmModal({ isOpen: false, partner: null, action: null, isSubmitting: false });
    } catch (err) {
      console.error(`Error during partner ${action}:`, err);
      setConfirmModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleMarkUnderReview = async (partnerId) => {
    try {
      await setPendingReview(partnerId);
    } catch (err) {
      console.error("Error setting under review:", err);
    }
  };

  const handleCreateSample = async () => {
    setIsCreatingSample(true);
    try {
      await createSamplePartnerApplication();
    } finally {
      setIsCreatingSample(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Partner Verification & Management Dashboard"
        subtitle="Live Firestore queue: Review business credentials, verify identity proofs, and approve salon onboarding."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF6E9] text-[#9A6700] border border-[#F7E1B5]">
            {pendingCount} Awaiting Decision
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateSample}
              disabled={isCreatingSample}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] rounded-xl hover:bg-[#F8F6F1] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              title="Add a sample partner application with PDF proofs to Cloud Firestore"
            >
              <PlusCircle className={`w-3.5 h-3.5 text-[#B96F45] ${isCreatingSample ? "animate-spin" : ""}`} />
              <span>{isCreatingSample ? "Creating in Firestore..." : "Seed Test Application"}</span>
            </button>
            <Link
              href="/admin/partners"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] rounded-xl hover:bg-[#F8F6F1] shadow-xs transition-colors"
            >
              <span>All Partners Directory</span>
            </Link>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E4DB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#77746E] uppercase tracking-wider">
              Total Applications
            </span>
            <h4 className="text-2xl font-bold text-[#292824] mt-1">{totalCount}</h4>
            <span className="text-[11px] text-[#A09D96]">Registered in Cloud Firestore</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Queue */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E4DB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#9A6700] uppercase tracking-wider">
              Pending & Review Queue
            </span>
            <h4 className="text-2xl font-bold text-[#9A6700] mt-1">{pendingCount}</h4>
            <span className="text-[11px] text-[#A09D96]">Requires administrative decision</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEF6E9] border border-[#F7E1B5] text-[#9A6700] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Approved Partners */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E4DB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#2D6A4F] uppercase tracking-wider">
              Verified & Approved
            </span>
            <h4 className="text-2xl font-bold text-[#2D6A4F] mt-1">{approvedCount}</h4>
            <span className="text-[11px] text-[#A09D96]">Active booking access enabled</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] border border-[#C6E2D0] text-[#2D6A4F] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Rejected Applications */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E4DB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#B3392E] uppercase tracking-wider">
              Rejected Applications
            </span>
            <h4 className="text-2xl font-bold text-[#B3392E] mt-1">{rejectedCount}</h4>
            <span className="text-[11px] text-[#A09D96]">Reason archived for applicant</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FDECEB] border border-[#F7C2BE] text-[#B3392E] flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Firestore Error Alert (if rules or network fail) */}
      {partnersError && (
        <div className="p-4 rounded-2xl bg-[#FDECEB] border border-[#F7C2BE] text-xs text-[#B3392E] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Cloud Firestore Connection Notice</strong>
            <p className="mt-0.5 leading-relaxed">{partnersError}</p>
          </div>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search partner, business, legal name, email, phone, GSTIN..."
            />
          </div>

          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Application Statuses" },
              { value: "Pending", label: "Pending Verification" },
              { value: "Under Review", label: "Under Review" },
              { value: "Approved", label: "Approved / Verified" },
              { value: "Rejected", label: "Rejected" },
            ]}
          />

          <div className="flex items-center justify-end text-xs text-[#77746E]">
            <span>
              Showing <strong className="text-[#292824]">{filteredPartners.length}</strong> of {partners.length} applications
            </span>
          </div>
        </div>
      </div>

      {/* Applications Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {partnersLoading ? (
          /* Loading Skeleton */
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#77746E] mb-4">
              <RefreshCw className="w-4 h-4 animate-spin text-[#B96F45]" />
              <span>Fetching live partner applications from Cloud Firestore...</span>
            </div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E9E4DB] animate-pulse flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#E9E4DB] rounded w-1/3" />
                  <div className="h-3 bg-[#E9E4DB] rounded w-1/2" />
                </div>
                <div className="h-8 bg-[#E9E4DB] rounded w-24" />
              </div>
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={FileCheck}
            title={partners.length === 0 ? "No Partner Applications in Database Yet" : "No Applications Match Filter"}
            description={
              partners.length === 0
                ? "There are currently no partner registrations in Cloud Firestore. Click below to generate a test partner application with verification documents."
                : "Try clearing your search query or setting the status filter back to 'All Application Statuses'."
            }
            actionLabel={partners.length === 0 ? "Seed Test Partner Application" : "Reset Filters"}
            onAction={
              partners.length === 0
                ? handleCreateSample
                : () => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }
            }
          />
        ) : (
          /* Responsive Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Business & Applicant</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Registration & Address</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Documents</th>
                  <th className="px-5 py-3.5 text-right">Review Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedPartners.map((partner) => {
                  const docCount = partner.documents?.length || 0;
                  const isApproved = partner.verificationStatus === "Approved";
                  const isRejected = partner.verificationStatus === "Rejected";

                  return (
                    <tr
                      key={partner.id}
                      className="hover:bg-[#FAF9F5] transition-colors"
                    >
                      {/* Business & Applicant Column */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#292824] text-sm flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#B96F45] shrink-0" />
                          <span>{partner.businessName}</span>
                        </div>
                        <div className="text-[11px] text-[#77746E] mt-0.5 ml-6">
                          Proprietor: <strong className="text-[#292824]">{partner.legalName || partner.name}</strong>
                        </div>
                        <div className="text-[10px] text-[#A09D96] font-mono mt-0.5 ml-6">
                          UID: {partner.id}
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-[#292824] font-medium">
                          <Mail className="w-3.5 h-3.5 text-[#77746E] shrink-0" />
                          <a
                            href={`mailto:${partner.email}`}
                            className="hover:text-[#B96F45] hover:underline truncate max-w-[170px]"
                            title={partner.email}
                          >
                            {partner.email || "No email"}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#77746E] text-[11px] mt-1">
                          <Phone className="w-3.5 h-3.5 text-[#77746E] shrink-0" />
                          <a
                            href={`tel:${partner.phone}`}
                            className="hover:text-[#B96F45] hover:underline"
                          >
                            {partner.phone || "No phone"}
                          </a>
                        </div>
                      </td>

                      {/* Registration & Address */}
                      <td className="px-4 py-4 max-w-[220px]">
                        <div className="text-[11px] font-semibold text-[#292824]">
                          {partner.businessType || "Proprietorship"}
                        </div>
                        {partner.regNumber && (
                          <div className="text-[10px] font-mono font-bold text-[#B96F45] mt-0.5">
                            {partner.regNumber}
                          </div>
                        )}
                        <p className="text-[11px] text-[#77746E] truncate mt-0.5" title={partner.businessAddress}>
                          {partner.businessAddress || partner.city || "Address not provided"}
                        </p>
                      </td>

                      {/* Submission Date */}
                      <td className="px-4 py-4 text-[#54514B]">
                        <div>{formatDate(partner.submittedAt)}</div>
                        <div className="text-[10px] text-[#A09D96] mt-0.5">
                          {formatDateTime(partner.submittedAt).split(",")[1]?.trim()}
                        </div>
                      </td>

                      {/* Status & Review Reason */}
                      <td className="px-4 py-4">
                        <StatusBadge status={partner.verificationStatus} size="sm" />
                        {isRejected && partner.rejectionReason && (
                          <div
                            className="mt-1 text-[10px] text-[#B3392E] bg-[#FDECEB] px-2 py-0.5 rounded border border-[#F7C2BE] truncate max-w-[160px]"
                            title={partner.rejectionReason}
                          >
                            Reason: {partner.rejectionReason}
                          </div>
                        )}
                        {partner.reviewedBy && (
                          <div className="text-[9px] text-[#A09D96] mt-0.5">
                            Rev: {partner.reviewerEmail?.split("@")[0] || "Admin"}
                          </div>
                        )}
                      </td>

                      {/* Documents Badge */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPartnerId(partner.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824] hover:border-[#B96F45] hover:text-[#B96F45] transition-colors cursor-pointer"
                          title="Click to inspect all submitted documents"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#B96F45]" />
                          <span>{docCount} {docCount === 1 ? "Doc" : "Docs"}</span>
                        </button>
                      </td>

                      {/* Review Decisions Buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. Review Dossier Drawer */}
                          <button
                            type="button"
                            onClick={() => setSelectedPartnerId(partner.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] hover:bg-[#F8F6F1] hover:border-[#B96F45] rounded-lg transition-colors cursor-pointer shadow-xs"
                            title="Open full application review dossier"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#B96F45]" />
                            <span>Review</span>
                          </button>

                          {/* 2. Mark Under Review (if not already under review or approved) */}
                          {partner.verificationStatus !== "Under Review" && !isApproved && (
                            <button
                              type="button"
                              onClick={() => handleMarkUnderReview(partner.id)}
                              className="p-1.5 rounded-lg text-[#9A6700] hover:bg-[#FEF6E9] transition-colors"
                              title="Set status to Under Review"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}

                          {/* 3. Quick Approve */}
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(partner)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#23533E] rounded-lg transition-colors cursor-pointer shadow-xs"
                              title="Verify and Approve Partner Application"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* 4. Quick Reject */}
                          {!isRejected && !isApproved && (
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(partner)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#B3392E] bg-[#FDECEB] border border-[#F7C2BE] hover:bg-[#F9D4D0] rounded-lg transition-colors cursor-pointer"
                              title="Reject Application with Recorded Reason"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredPartners.length}
          pageSize={pageSize}
        />
      </div>

      {/* Side-Out Review Drawer (Application Dossier) */}
      {activePartner && (
        <PartnerReviewDrawer
          isOpen={!!activePartner}
          partner={activePartner}
          onClose={() => setSelectedPartnerId(null)}
          onApprove={(p) => {
            handleOpenApproveModal(p);
          }}
          onReject={(p) => {
            handleOpenRejectModal(p);
          }}
          onPendingReview={async (pId) => {
            await handleMarkUnderReview(pId);
          }}
          onUpdateDocStatus={(pId, docId, status, notes) => {
            updateDocumentStatus(pId, docId, status, notes);
          }}
        />
      )}

      {/* Confirmation Modal for Approve / Reject */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          !confirmModal.isSubmitting &&
          setConfirmModal({ isOpen: false, partner: null, action: null, isSubmitting: false })
        }
        onConfirm={handleConfirmAction}
        type={confirmModal.action === "reject" ? "danger" : "success"}
        title={
          confirmModal.action === "approve"
            ? `Approve Partner ${confirmModal.partner?.businessName || confirmModal.partner?.name}?`
            : `Reject Application for ${confirmModal.partner?.businessName || confirmModal.partner?.name}?`
        }
        message={
          confirmModal.action === "approve"
            ? `Approving this partner will verify their business KYC in Cloud Firestore, mark all submitted documents as approved, set account status to Active, and allow them to list branches and accept customer bookings.`
            : `Rejecting this application will record your rejection reason in Cloud Firestore, update their onboarding status to Rejected, and suspend booking privileges while keeping all submitted documents preserved for audit.`
        }
        confirmText={
          confirmModal.isSubmitting
            ? "Updating Firestore..."
            : confirmModal.action === "approve"
            ? "Confirm & Approve Partner"
            : "Confirm Rejection"
        }
        requiresReason={confirmModal.action === "reject"}
        reasonPlaceholder="Specify the administrative rejection reason (e.g., Trade license expired, GST number mismatch with MCA database, illegible ID proof)..."
      />
    </div>
  );
}
