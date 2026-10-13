"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileCheck,
  FileText,
  Eye,
  Clock,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import DocumentPreviewModal from "../../../components/ui/DocumentPreviewModal";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";
import { formatDate } from "../../../lib/utils";
import { DOCUMENT_TYPES } from "../../../lib/constants";

export default function DocumentVerificationPage() {
  const { partners, updateDocumentStatus, requestResubmission } = useAdmin();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Selected document for preview modal
  const [activePreview, setActivePreview] = useState(null); // { doc, partner }

  // Flatten all documents across partners into a reviewable list
  const allDocuments = useMemo(() => {
    const list = [];
    partners.forEach((partner) => {
      partner.documents?.forEach((doc) => {
        list.push({
          ...doc,
          partnerId: partner.id,
          partnerName: partner.name,
          partnerBusiness: partner.businessName,
          partnerCity: partner.city,
          partnerEmail: partner.email,
        });
      });
    });
    return list;
  }, [partners]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return allDocuments.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.partnerName.toLowerCase().includes(search.toLowerCase()) ||
        item.partnerBusiness.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      const matchType = typeFilter === "ALL" || item.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [allDocuments, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize) || 1;
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary counts
  const pendingCount = allDocuments.filter((d) => d.status === "Pending").length;
  const underReviewCount = allDocuments.filter((d) => d.status === "Under Review").length;
  const approvedCount = allDocuments.filter((d) => d.status === "Approved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Verification Workspace"
        subtitle="Review, approve, or reject identity, trade licenses, and business proofs for partner onboarding."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF6E9] text-[#9A6700] border border-[#F7E1B5]">
            {pendingCount} Awaiting Inspection
          </span>
        }
      />

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E9E4DB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#77746E] uppercase">
              Pending Queue
            </span>
            <h4 className="text-xl font-bold text-[#9A6700] mt-1">{pendingCount}</h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#FEF6E9] text-[#9A6700] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E9E4DB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#77746E] uppercase">
              Under Review
            </span>
            <h4 className="text-xl font-bold text-[#B96F45] mt-1">{underReviewCount}</h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F6ECE5] text-[#B96F45] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E9E4DB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#77746E] uppercase">
              Approved Documents
            </span>
            <h4 className="text-xl font-bold text-[#2D6A4F] mt-1">{approvedCount}</h4>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EBF5EE] text-[#2D6A4F] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by document name, partner or business entity..."
            />
          </div>

          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Review Statuses" },
              { value: "Pending", label: "Pending" },
              { value: "Under Review", label: "Under Review" },
              { value: "Approved", label: "Approved" },
              { value: "Rejected", label: "Rejected" },
              { value: "Resubmission Requested", label: "Resubmission Requested" },
            ]}
          />

          <FilterDropdown
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Document Types" },
              ...DOCUMENT_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {paginatedDocs.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="No documents matching filter"
            description="Adjust your search term or select 'All Review Statuses' to inspect partner records."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTypeFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Document Name & ID</th>
                  <th className="px-4 py-3.5">Partner / Business</th>
                  <th className="px-4 py-3.5">Document Type</th>
                  <th className="px-4 py-3.5">Submitted Date</th>
                  <th className="px-4 py-3.5">Review Status</th>
                  <th className="px-5 py-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedDocs.map((item) => (
                  <tr key={`${item.partnerId}-${item.id}`} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#292824] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#B96F45] shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-[11px] text-[#77746E] font-mono mt-0.5 ml-6">
                        {item.id} • {item.size || "2.4 MB"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/partners/${item.partnerId}`}
                        className="font-semibold text-[#292824] hover:text-[#B96F45] hover:underline"
                      >
                        {item.partnerName}
                      </Link>
                      <div className="text-[11px] text-[#77746E]">
                        {item.partnerBusiness} ({item.partnerCity})
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824]">
                        {item.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[#54514B]">
                      {formatDate(item.submittedDate)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const partnerObj = partners.find((p) => p.id === item.partnerId);
                          setActivePreview({ doc: item, partner: partnerObj });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review & Decide</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredDocs.length}
          pageSize={pageSize}
        />
      </div>

      {/* Document Review Modal */}
      {activePreview && (
        <DocumentPreviewModal
          isOpen={!!activePreview}
          onClose={() => setActivePreview(null)}
          document={activePreview.doc}
          partner={activePreview.partner}
          onApprove={(pId, dId, notes) => updateDocumentStatus(pId, dId, "Approved", notes)}
          onReject={(pId, dId, notes) => updateDocumentStatus(pId, dId, "Rejected", notes)}
          onRequestResubmission={(pId, dId, notes) => requestResubmission(pId, dId, notes)}
        />
      )}
    </div>
  );
}
