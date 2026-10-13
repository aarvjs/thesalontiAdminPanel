"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarCheck,
  Eye,
  Home,
  Store,
  X,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/ui/Pagination";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";
import { formatCurrency, formatDate } from "../../../lib/utils";

export default function BookingsPage() {
  const { bookings, updateBookingStatus } = useAdmin();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selected booking for detail modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !search.trim() ||
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.salonName.toLowerCase().includes(search.toLowerCase()) ||
        b.serviceName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
      const matchMode = modeFilter === "ALL" || b.serviceMode === modeFilter;

      return matchSearch && matchStatus && matchMode;
    });
  }, [bookings, search, statusFilter, modeFilter]);

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings & Appointments"
        subtitle="Platform-wide appointment tracking, customer bookings, and service mode dispatch."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6]">
            {bookings.length} Total Bookings
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
              placeholder="Search by booking ID, customer, salon, or service..."
            />
          </div>

          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Booking Statuses" },
              { value: "Confirmed", label: "Confirmed" },
              { value: "Pending", label: "Pending" },
              { value: "Completed", label: "Completed" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
          />

          <FilterDropdown
            value={modeFilter}
            onChange={(val) => {
              setModeFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Service Modes" },
              { value: "Salon Visit", label: "In-Salon Visit" },
              { value: "Home Service", label: "Doorstep Home Service" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {paginatedBookings.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No bookings match criteria"
            description="Adjust your search term or select 'All Booking Statuses'."
            actionLabel="Reset"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
              setModeFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Booking ID & Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Salon & Branch</th>
                  <th className="px-4 py-3.5">Service & Price</th>
                  <th className="px-4 py-3.5">Service Mode</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedBookings.map((bkg) => (
                  <tr key={bkg.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#292824] font-mono">
                        {bkg.id}
                      </div>
                      <div className="text-[11px] text-[#77746E] mt-0.5">
                        {formatDate(bkg.bookingDate)} • {bkg.slotTime}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#292824]">
                        {bkg.customerName}
                      </div>
                      <div className="text-[11px] text-[#77746E]">
                        {bkg.customerPhone}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#292824]">
                        {bkg.salonName}
                      </div>
                      <div className="text-[11px] text-[#77746E]">
                        {bkg.branchName}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-[#292824] font-medium line-clamp-1">
                        {bkg.serviceName}
                      </div>
                      <div className="text-[11px] font-bold text-[#B96F45] mt-0.5">
                        {formatCurrency(bkg.amount)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          bkg.serviceMode === "Home Service"
                            ? "bg-[#FDF6E9] text-[#885B28] border-[#EFE1C5]"
                            : "bg-[#F6ECE5] text-[#B96F45] border-[#EBD4C6]"
                        }`}
                      >
                        {bkg.serviceMode === "Home Service" ? (
                          <Home className="w-3 h-3 text-[#885B28]" />
                        ) : (
                          <Store className="w-3 h-3 text-[#B96F45]" />
                        )}
                        <span>{bkg.serviceMode}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={bkg.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(bkg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#B96F45] bg-[#F6ECE5] hover:bg-[#EBD4C6] rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
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
          totalItems={filteredBookings.length}
          pageSize={pageSize}
        />
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#E9E4DB] shadow-2xl p-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F3EFE8]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-[#F3EFE8] pr-8">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#B96F45]">
                  {selectedBooking.id}
                </span>
                <h3 className="text-base font-bold text-[#292824] mt-0.5">
                  Appointment Details
                </h3>
              </div>
              <StatusBadge status={selectedBooking.status} size="sm" />
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB]">
                <div>
                  <span className="text-[#77746E] block mb-0.5">Customer</span>
                  <span className="font-bold text-[#292824]">{selectedBooking.customerName}</span>
                  <span className="block text-[11px] text-[#77746E]">{selectedBooking.customerPhone}</span>
                </div>
                <div>
                  <span className="text-[#77746E] block mb-0.5">Service Mode</span>
                  <span className="font-bold text-[#B96F45]">{selectedBooking.serviceMode}</span>
                  <span className="block text-[11px] text-[#77746E]">{selectedBooking.paymentMode}</span>
                </div>
              </div>

              <div>
                <span className="text-[#77746E] block mb-1">Service & Pricing</span>
                <div className="p-3 rounded-xl border border-[#E9E4DB] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#292824] block">{selectedBooking.serviceName}</span>
                    <span className="text-[11px] text-[#77746E]">{selectedBooking.salonName} • {selectedBooking.branchName}</span>
                  </div>
                  <span className="text-base font-bold text-[#292824]">
                    {formatCurrency(selectedBooking.amount)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#77746E] block mb-1">Assigned Stylist & Location</span>
                <p className="text-[#292824] font-medium">{selectedBooking.address}</p>
                <p className="text-[11px] text-[#77746E] mt-0.5">Stylist: {selectedBooking.stylistName}</p>
              </div>

              {selectedBooking.notes && (
                <div className="p-2.5 rounded-lg bg-[#FEF6E9] border border-[#F7E1B5] text-[#9A6700] text-[11px]">
                  <strong>Customer Instructions:</strong> {selectedBooking.notes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#F3EFE8] flex items-center justify-between">
              <span className="text-[11px] text-[#77746E]">
                Slot: {formatDate(selectedBooking.bookingDate)} at {selectedBooking.slotTime}
              </span>

              <div className="flex items-center gap-2">
                {selectedBooking.status === "Pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, "Confirmed");
                      setSelectedBooking(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2D6A4F] rounded-lg hover:bg-[#23533E]"
                  >
                    Confirm Booking
                  </button>
                )}
                {selectedBooking.status === "Confirmed" && (
                  <button
                    type="button"
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, "Completed");
                      setSelectedBooking(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B96F45] rounded-lg hover:bg-[#9F5935]"
                  >
                    Mark Completed
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-3 py-1.5 text-xs font-medium text-[#292824] bg-white border border-[#E9E4DB] rounded-lg hover:bg-[#F8F6F1]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
