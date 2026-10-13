"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Store, Eye, GitBranch, Power } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";

export default function SalonsPage() {
  const { salons, toggleSalonStatus } = useAdmin();

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredSalons = useMemo(() => {
    return salons.filter((s) => {
      const matchSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.partnerName.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase());

      const matchCity = cityFilter === "ALL" || s.city === cityFilter;
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;

      return matchSearch && matchCity && matchStatus;
    });
  }, [salons, search, cityFilter, statusFilter]);

  const totalPages = Math.ceil(filteredSalons.length / pageSize) || 1;
  const paginatedSalons = filteredSalons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salons Directory"
        subtitle="Platform-wide registered salons, physical brands, and service categories."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6]">
            {salons.length} Listed Brands
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
              placeholder="Search by salon brand, partner or category..."
            />
          </div>

          <FilterDropdown
            value={cityFilter}
            onChange={(val) => {
              setCityFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Cities" },
              { value: "Kanpur", label: "Kanpur" },
              { value: "Gurugram", label: "Gurugram" },
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
        {paginatedSalons.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No salons found"
            description="Adjust your search criteria to view listed salons."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch("");
              setCityFilter("ALL");
              setStatusFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Salon Brand</th>
                  <th className="px-4 py-3.5">Managing Partner</th>
                  <th className="px-4 py-3.5">Category & Rating</th>
                  <th className="px-4 py-3.5">City & Outlets</th>
                  <th className="px-4 py-3.5">Service Modes</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedSalons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#292824] flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#B96F45] shrink-0" />
                        <span>{salon.name}</span>
                      </div>
                      <div className="text-[11px] text-[#77746E] ml-6 font-mono">
                        {salon.id} • Est. {salon.establishedYear}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/partners/${salon.partnerId}`}
                        className="font-semibold text-[#292824] hover:text-[#B96F45] hover:underline"
                      >
                        {salon.partnerName}
                      </Link>
                      <div className="text-[11px] text-[#77746E]">
                        {salon.contactNumber}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-[#292824] font-medium">{salon.category}</div>
                      <div className="text-[11px] text-[#B96F45] font-semibold mt-0.5">
                        ⭐ {salon.rating} ({salon.reviewCount} reviews)
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#292824]">{salon.city}</div>
                      <Link
                        href="/admin/branches"
                        className="text-[11px] text-[#B96F45] hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>{salon.branchesCount} Branches</span>
                      </Link>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {salon.serviceModes.map((mode) => (
                          <span
                            key={mode}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824]"
                          >
                            {mode}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={salon.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/partners/${salon.partnerId}`}
                          className="p-1.5 rounded-lg text-[#77746E] hover:text-[#B96F45] hover:bg-[#F6ECE5] transition-colors"
                          title="View Partner Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleSalonStatus(salon.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            salon.status === "Active"
                              ? "text-[#77746E] hover:text-[#B3392E] hover:bg-[#FDECEB]"
                              : "text-[#77746E] hover:text-[#2D6A4F] hover:bg-[#EBF5EE]"
                          }`}
                          title={salon.status === "Active" ? "Deactivate Salon" : "Activate Salon"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
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
          totalItems={filteredSalons.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
