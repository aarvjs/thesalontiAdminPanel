"use client";

import React, { useState, useMemo } from "react";
import { Scissors, Power, Clock } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";
import { formatCurrency } from "../../../lib/utils";

export default function ServicesPage() {
  const { services, toggleServiceStatus } = useAdmin();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const categories = useMemo(() => {
    return Array.from(new Set(services.map((s) => s.category)));
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.salonName.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === "ALL" || s.category === categoryFilter;

      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [services, search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredServices.length / pageSize) || 1;
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Services Catalog"
        subtitle="Standardized salon treatments, haircuts, skin procedures, and pricing tiers."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6]">
            {services.length} Listed Services
          </span>
        }
      />

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by service name, salon or category..."
            />
          </div>

          <FilterDropdown
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Categories" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />

          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {paginatedServices.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="No services found"
            description="Adjust your search criteria to view salon services."
            actionLabel="Reset"
            onAction={() => {
              setSearch("");
              setCategoryFilter("ALL");
              setStatusFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Service Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Salon Provider</th>
                  <th className="px-4 py-3.5">Standard Price</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Service Mode</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedServices.map((srv) => (
                  <tr key={srv.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#292824] flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-[#B96F45] shrink-0" />
                        <span>{srv.name}</span>
                      </div>
                      <div className="text-[11px] text-[#77746E] ml-5 font-mono">
                        {srv.id} • Popularity: {srv.popularity}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824]">
                        {srv.category}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#292824]">{srv.salonName}</div>
                      <div className="text-[11px] text-[#77746E]">{srv.partnerName}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-sm text-[#292824]">
                        {formatCurrency(srv.price)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[#54514B]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#77746E]" />
                        {srv.duration}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={srv.serviceMode} size="sm" />
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={srv.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleServiceStatus(srv.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          srv.status === "Active"
                            ? "text-[#77746E] hover:text-[#B3392E] hover:bg-[#FDECEB]"
                            : "text-[#77746E] hover:text-[#2D6A4F] hover:bg-[#EBF5EE]"
                        }`}
                        title={srv.status === "Active" ? "Disable service" : "Enable service"}
                      >
                        <Power className="w-4 h-4" />
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
          totalItems={filteredServices.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
