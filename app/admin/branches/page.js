"use client";

import React, { useState, useMemo } from "react";
import { GitBranch, User } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";

export default function BranchesPage() {
  const { branches, addToast } = useAdmin();

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchSearch =
        !search.trim() ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.salonName.toLowerCase().includes(search.toLowerCase()) ||
        b.managerName.toLowerCase().includes(search.toLowerCase()) ||
        b.area.toLowerCase().includes(search.toLowerCase());

      const matchArea = areaFilter === "ALL" || b.area === areaFilter;

      return matchSearch && matchArea;
    });
  }, [branches, search, areaFilter]);

  const totalPages = Math.ceil(filteredBranches.length / pageSize) || 1;
  const paginatedBranches = filteredBranches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Operations"
        subtitle="Physical salon branches, assigned branch managers, and localized outlet statuses."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6]">
            {branches.length} Physical Branches
          </span>
        }
      />

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by branch name, manager, parent salon or locality..."
            />
          </div>

          <FilterDropdown
            value={areaFilter}
            onChange={(val) => {
              setAreaFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Localities" },
              { value: "Civil Lines", label: "Civil Lines" },
              { value: "Swaroop Nagar", label: "Swaroop Nagar" },
              { value: "Tilak Nagar", label: "Tilak Nagar" },
              { value: "Mall Road", label: "Mall Road" },
              { value: "Kakadeo", label: "Kakadeo" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {paginatedBranches.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No branches found"
            description="Adjust your search query or area filters."
            actionLabel="Reset"
            onAction={() => {
              setSearch("");
              setAreaFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Branch Outlet</th>
                  <th className="px-4 py-3.5">Parent Salon Brand</th>
                  <th className="px-4 py-3.5">Assigned Manager</th>
                  <th className="px-4 py-3.5">Location & Address</th>
                  <th className="px-4 py-3.5">Staff Count</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#292824] flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-[#B96F45] shrink-0" />
                        <span>{branch.name}</span>
                      </div>
                      <div className="text-[11px] text-[#77746E] ml-6 font-mono">
                        {branch.id} • Est. {branch.openedDate}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-semibold text-[#292824] block">
                        {branch.salonName}
                      </span>
                      <span className="text-[11px] text-[#77746E]">
                        Partner: {branch.partnerName}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#292824] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#B96F45]" />
                        <span>{branch.managerName}</span>
                      </div>
                      <div className="text-[11px] text-[#77746E] mt-0.5">
                        {branch.managerPhone}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[#54514B]">
                      <div className="font-semibold text-[#292824]">
                        {branch.area}, {branch.city}
                      </div>
                      <div className="text-[11px] text-[#77746E] line-clamp-1">
                        {branch.address}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824]">
                        {branch.staffCount} Stylists
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={branch.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          addToast(
                            `Manager audit logs for ${branch.name} loaded.`,
                            "info"
                          )
                        }
                        className="px-2.5 py-1 text-xs font-semibold text-[#B96F45] bg-[#F6ECE5] hover:bg-[#EBD4C6] rounded-lg transition-colors"
                      >
                        Inspect
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
          totalItems={filteredBranches.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
