"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Eye,
  FileCheck,
  ShieldCheck,
  Ban,
  CheckCircle,
  Download,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";
import { formatDate } from "../../../lib/utils";

function PartnersContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";

  const { partners, suspendPartner, reactivatePartner, addToast } = useAdmin();

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [accountFilter, setAccountFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Confirmation modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    partnerId: null,
    partnerName: null,
    action: null, // "suspend" | "reactivate"
  });

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.businessName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" || p.verificationStatus === statusFilter;

      const matchAccount =
        accountFilter === "ALL" || p.accountStatus === accountFilter;

      return matchSearch && matchStatus && matchAccount;
    });
  }, [partners, search, statusFilter, accountFilter]);

  const totalPages = Math.ceil(filteredPartners.length / pageSize) || 1;
  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenSuspendModal = (partner) => {
    setModalState({
      isOpen: true,
      partnerId: partner.id,
      partnerName: partner.name,
      action: "suspend",
    });
  };

  const handleOpenReactivateModal = (partner) => {
    setModalState({
      isOpen: true,
      partnerId: partner.id,
      partnerName: partner.name,
      action: "reactivate",
    });
  };

  const handleConfirmModal = (reason) => {
    if (modalState.action === "suspend") {
      suspendPartner(modalState.partnerId, reason || "Administrative sanction");
    } else if (modalState.action === "reactivate") {
      reactivatePartner(modalState.partnerId);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partners"
        subtitle="Review registrations, verification status and platform access."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                addToast("Exporting partners database to CSV...", "info")
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] rounded-xl hover:bg-[#F8F6F1] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/admin/verification"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-xl shadow-sm transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>Verification Queue</span>
            </Link>
          </div>
        }
      />

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by partner name, email, business or city..."
            />
          </div>

          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Verification Statuses" },
              { value: "Approved", label: "Approved" },
              { value: "Pending Verification", label: "Pending Verification" },
              { value: "Under Review", label: "Under Review" },
              { value: "Rejected", label: "Rejected" },
            ]}
          />

          <FilterDropdown
            value={accountFilter}
            onChange={(val) => {
              setAccountFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Account Statuses" },
              { value: "Active", label: "Active" },
              { value: "Suspended", label: "Suspended" },
            ]}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {paginatedPartners.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No partners match criteria"
            description="Try resetting your search query or status filters to view the full partner list."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
              setAccountFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Partner</th>
                  <th className="px-4 py-3.5">Business Entity</th>
                  <th className="px-4 py-3.5">Registration Date</th>
                  <th className="px-4 py-3.5">Verification</th>
                  <th className="px-4 py-3.5">Enabled Features</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedPartners.map((partner) => {
                  const enabledCount = Object.values(
                    partner.enabledFeatures || {}
                  ).filter(Boolean).length;
                  const totalModules = Object.keys(
                    partner.enabledFeatures || {}
                  ).length || 10;

                  return (
                    <tr
                      key={partner.id}
                      className="hover:bg-[#FAF9F5] transition-colors"
                    >
                      {/* Partner Column */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#292824]">
                          {partner.name}
                        </div>
                        <div className="text-[11px] text-[#77746E]">
                          {partner.email}
                        </div>
                        <div className="text-[10px] text-[#A09D96] font-mono mt-0.5">
                          {partner.id} • {partner.city}
                        </div>
                      </td>

                      {/* Business Entity */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#292824]">
                          {partner.businessName}
                        </div>
                        <div className="text-[11px] text-[#77746E]">
                          {partner.branchCount} Branch
                          {partner.branchCount > 1 ? "es" : ""} • ⭐{" "}
                          {partner.rating}
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="px-4 py-4 text-[#54514B]">
                        {formatDate(partner.registrationDate)}
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-4">
                        <StatusBadge
                          status={partner.verificationStatus}
                          size="sm"
                        />
                      </td>

                      {/* Enabled Features */}
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/permissions?partner=${partner.id}`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824] hover:border-[#B96F45] transition-colors"
                          title="Click to manage permissions"
                        >
                          <ShieldCheck className="w-3 h-3 text-[#B96F45]" />
                          <span>
                            {enabledCount}/{totalModules} active
                          </span>
                        </Link>
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={partner.accountStatus} size="sm" />
                      </td>

                      {/* Row Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/partners/${partner.id}`}
                            className="p-1.5 rounded-lg text-[#77746E] hover:text-[#B96F45] hover:bg-[#F6ECE5] transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <Link
                            href="/admin/verification"
                            className="p-1.5 rounded-lg text-[#77746E] hover:text-[#2D6A4F] hover:bg-[#EBF5EE] transition-colors"
                            title="Review Documents"
                          >
                            <FileCheck className="w-4 h-4" />
                          </Link>

                          {partner.accountStatus === "Active" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSuspendModal(partner)}
                              className="p-1.5 rounded-lg text-[#77746E] hover:text-[#B3392E] hover:bg-[#FDECEB] transition-colors"
                              title="Suspend Account"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReactivateModal(partner)}
                              className="p-1.5 rounded-lg text-[#77746E] hover:text-[#2D6A4F] hover:bg-[#EBF5EE] transition-colors"
                              title="Reactivate Account"
                            >
                              <CheckCircle className="w-4 h-4" />
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

        {/* Local Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredPartners.length}
          pageSize={pageSize}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, partnerId: null, action: null })}
        onConfirm={handleConfirmModal}
        type={modalState.action === "suspend" ? "danger" : "success"}
        title={
          modalState.action === "suspend"
            ? `Suspend ${modalState.partnerName}?`
            : `Reactivate ${modalState.partnerName}?`
        }
        message={
          modalState.action === "suspend"
            ? "Suspending this partner will immediately freeze their salon listings, booking acceptances, and manager dashboards across all branches. This does not delete their data."
            : "Reactivating this partner will restore their customer booking visibility and branch manager dashboard access."
        }
        confirmText={
          modalState.action === "suspend" ? "Suspend Account" : "Reactivate Account"
        }
        requiresReason={modalState.action === "suspend"}
        reasonPlaceholder="Specify reason for suspension (e.g., Compliance audit, customer dispute)..."
      />
    </div>
  );
}

export default function PartnersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#77746E]">
          Loading partners directory...
        </div>
      }
    >
      <PartnersContent />
    </Suspense>
  );
}

