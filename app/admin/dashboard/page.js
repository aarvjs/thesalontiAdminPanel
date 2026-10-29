"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  FileCheck,
  Store,
  CalendarCheck,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  ChevronRight,
  Home,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useAdmin } from "../../../context/AdminContext";
import { formatDate, formatDateTime } from "../../../lib/utils";

export default function AdminDashboardPage() {
  const { partners, salons, bookings, logs } = useAdmin();

  // Compute metrics
  const totalPartners = partners.length;
  const pendingPartners = partners.filter(
    (p) =>
      p.verificationStatus === "Pending" ||
      p.verificationStatus === "Pending Verification" ||
      p.verificationStatus === "Under Review" ||
      p.verificationStatus === "Action Required"
  );
  const approvedSalons = salons.filter((s) => s.status === "Active").length;
  const activeBookings = bookings.filter((b) => b.status === "Confirmed" || b.status === "Pending").length;
  const homeServiceBookings = bookings.filter((b) => b.serviceMode === "Home Service").length;
  const salonVisitBookings = bookings.filter((b) => b.serviceMode === "Salon Visit").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Administrative Overview"
        subtitle="Live platform metrics, partner verification queues, and booking activity."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/verification"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-xl shadow-sm transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>Review Verification Queue ({pendingPartners.length})</span>
            </Link>
          </div>
        }
      />

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Partners"
          value={totalPartners}
          description="Registered salon owners across cities"
          icon={Users}
          trend="+2 this week"
          trendType="positive"
        />

        <StatCard
          title="Pending Verification"
          value={pendingPartners.length}
          description="Applications awaiting compliance check"
          icon={FileCheck}
          badge={pendingPartners.length > 0 ? "Requires Action" : "All Clear"}
          trend={pendingPartners.length > 0 ? "Action required" : "Zero queue"}
          trendType={pendingPartners.length > 0 ? "negative" : "positive"}
        />

        <StatCard
          title="Approved Salons"
          value={approvedSalons}
          description="Active salons & outlets operating"
          icon={Store}
          trend="98.2% Uptime"
          trendType="positive"
        />

        <StatCard
          title="Active Bookings"
          value={activeBookings}
          description="Confirmed appointments today"
          icon={CalendarCheck}
          trend={`${homeServiceBookings} Doorstep`}
          trendType="positive"
        />
      </div>

      {/* Verification Queue Focus Banner */}
      {pendingPartners.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E4DB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FEF6E9] border border-[#F7E1B5] text-[#9A6700] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#292824]">
                {pendingPartners.length} Partner Application{pendingPartners.length > 1 ? "s" : ""} Awaiting Review
              </h3>
              <p className="text-xs text-[#77746E] mt-0.5">
                New partner registrations from Kanpur and Gurugram need identity and business verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/verification"
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-xl shadow-xs transition-colors"
            >
              <span>Inspect Documents</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2-Column Section: Recent Registrations & Operations Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Registrations Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#E9E4DB] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#292824]">
                Recent Partner Registrations
              </h3>
              <p className="text-xs text-[#77746E] mt-0.5">
                Latest partner submissions and document readiness
              </p>
            </div>
            <Link
              href="/admin/partners"
              className="text-xs font-semibold text-[#B96F45] hover:underline flex items-center gap-1"
            >
              <span>View all partners</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3">Partner Name</th>
                  <th className="px-4 py-3">Business Entity</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {partners.slice(0, 5).map((partner) => (
                  <tr key={partner.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#292824]">
                        {partner.name}
                      </div>
                      <div className="text-[11px] text-[#77746E] font-mono">
                        {partner.id}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#54514B]">
                      {partner.businessName}
                    </td>
                    <td className="px-4 py-3.5 text-[#54514B]">
                      {partner.city}
                    </td>
                    <td className="px-4 py-3.5 text-[#77746E]">
                      {formatDate(partner.registrationDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={partner.verificationStatus} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/partners/${partner.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#B96F45] bg-[#F6ECE5] hover:bg-[#EBD4C6] rounded-lg transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Operational Mode & Service Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#292824]">
              Operational Overview
            </h3>
            <p className="text-xs text-[#77746E] mt-0.5">
              Service mode distribution & marketplace health
            </p>

            <div className="mt-5 space-y-4">
              {/* Salon Visits */}
              <div className="p-3.5 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#292824] flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#B96F45]" />
                    In-Salon Visits
                  </span>
                  <span className="font-bold text-[#292824]">{salonVisitBookings} Bookings</span>
                </div>
                <div className="w-full bg-[#E9E4DB] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#B96F45] h-full rounded-full"
                    style={{ width: `${(salonVisitBookings / (bookings.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Home Services */}
              <div className="p-3.5 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#292824] flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-[#885B28]" />
                    At-Home Doorstep Services
                  </span>
                  <span className="font-bold text-[#292824]">{homeServiceBookings} Bookings</span>
                </div>
                <div className="w-full bg-[#E9E4DB] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D9BD83] h-full rounded-full"
                    style={{ width: `${(homeServiceBookings / (bookings.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Compliance Rating */}
              <div className="p-3.5 rounded-xl bg-[#EBF5EE] border border-[#C6E2D0] text-xs">
                <div className="flex items-center justify-between font-bold text-[#2D6A4F] mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    KYC Compliance Rate
                  </span>
                  <span>
                    {Math.round(
                      (partners.filter((p) => p.verificationStatus === "Approved").length /
                        (totalPartners || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <p className="text-[11px] text-[#2D6A4F]/80">
                  Government IDs and GST certificates validated against central registry.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F3EFE8] mt-6">
            <Link
              href="/admin/permissions"
              className="text-xs font-semibold text-[#B96F45] hover:underline flex items-center justify-between"
            >
              <span>Manage partner feature permissions</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#E9E4DB]">
          <div>
            <h3 className="text-sm font-bold text-[#292824]">
              Recent Administrative Activity
            </h3>
            <p className="text-xs text-[#77746E] mt-0.5">
              Live audit trail of administrative decisions, verifications, and permission updates
            </p>
          </div>
          <Link
            href="/admin/activity-logs"
            className="text-xs font-semibold text-[#B96F45] hover:underline flex items-center gap-1"
          >
            <span>Full audit log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#F3EFE8] mt-2">
          {logs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#B96F45] mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-[#292824]">{log.actor}</span>
                  <span className="text-[#77746E]"> — {log.details}</span>
                  <div className="text-[11px] text-[#A09D96] mt-0.5 font-mono">
                    Target: {log.target}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 text-[11px] text-[#77746E]">
                {formatDateTime(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
