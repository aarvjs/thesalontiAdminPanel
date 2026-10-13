"use client";

import React, { useState, useMemo } from "react";
import { UserCheck, Ban, CheckCircle, Eye, X } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";
import { formatCurrency, formatDate } from "../../../lib/utils";

export default function CustomersPage() {
  const { customers, toggleCustomerStatus } = useAdmin();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [prefFilter, setPrefFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchPref = prefFilter === "ALL" || c.preference === prefFilter;

      return matchSearch && matchStatus && matchPref;
    });
  }, [customers, search, statusFilter, prefFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers Directory"
        subtitle="End-user accounts, appointment engagement, and preference segmentation."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6]">
            {customers.length} Registered Users
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
              placeholder="Search by customer name, email or phone..."
            />
          </div>

          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Account Statuses" },
              { value: "Active", label: "Active" },
              { value: "Blocked", label: "Blocked" },
            ]}
          />

          <FilterDropdown
            value={prefFilter}
            onChange={(val) => {
              setPrefFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Style Preferences" },
              { value: "Male Grooming", label: "Male Grooming" },
              { value: "Female Beauty", label: "Female Beauty" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {paginatedCustomers.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No customers found"
            description="Adjust your search criteria to view customer profiles."
            actionLabel="Reset"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
              setPrefFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Style Preference</th>
                  <th className="px-4 py-3.5">Joined Date</th>
                  <th className="px-4 py-3.5">Bookings</th>
                  <th className="px-4 py-3.5">Total Spent</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#292824]">{c.name}</div>
                      <div className="text-[11px] text-[#77746E] font-mono">{c.id}</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-[#292824]">{c.email}</div>
                      <div className="text-[11px] text-[#77746E]">{c.phone}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824]">
                        {c.preference}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[#54514B]">
                      {formatDate(c.registrationDate)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-[#292824]">
                        {c.bookingCount} visits
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-[#B96F45]">
                        {formatCurrency(c.totalSpent)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="p-1.5 rounded-lg text-[#77746E] hover:text-[#B96F45] hover:bg-[#F6ECE5] transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCustomerStatus(c.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.status === "Active"
                              ? "text-[#77746E] hover:text-[#B3392E] hover:bg-[#FDECEB]"
                              : "text-[#77746E] hover:text-[#2D6A4F] hover:bg-[#EBF5EE]"
                          }`}
                          title={c.status === "Active" ? "Block Customer" : "Unblock Customer"}
                        >
                          {c.status === "Active" ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
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
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
        />
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#E9E4DB] shadow-2xl p-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F3EFE8]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-[#F3EFE8]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B96F45] to-[#9F5935] text-white flex items-center justify-center font-bold text-lg">
                {selectedCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292824]">{selectedCustomer.name}</h3>
                <span className="text-[11px] text-[#77746E]">{selectedCustomer.city} • {selectedCustomer.preference}</span>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#77746E]">Email:</span>
                  <span className="font-semibold text-[#292824]">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#77746E]">Phone:</span>
                  <span className="font-semibold text-[#292824]">{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#77746E]">Member Since:</span>
                  <span className="font-semibold text-[#292824]">{formatDate(selectedCustomer.registrationDate)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl border border-[#E9E4DB]">
                  <span className="text-[#77746E] text-[11px] block">Lifetime Bookings</span>
                  <span className="text-lg font-bold text-[#292824] mt-0.5 block">{selectedCustomer.bookingCount}</span>
                </div>
                <div className="p-3 rounded-xl border border-[#E9E4DB]">
                  <span className="text-[#77746E] text-[11px] block">Total Spent</span>
                  <span className="text-lg font-bold text-[#B96F45] mt-0.5 block">{formatCurrency(selectedCustomer.totalSpent)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F3EFE8] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] rounded-lg hover:bg-[#F8F6F1]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
