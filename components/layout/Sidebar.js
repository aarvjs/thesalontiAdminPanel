"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Store,
  GitBranch,
  CalendarCheck,
  Scissors,
  UserCheck,
  ShieldCheck,
  ClipboardList,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { NAV_ITEMS, BRAND } from "../../lib/constants";
import { useAdmin } from "../../context/AdminContext";

const ICON_MAP = {
  LayoutDashboard,
  Users,
  FileCheck,
  Store,
  GitBranch,
  CalendarCheck,
  Scissors,
  UserCheck,
  ShieldCheck,
  ClipboardList,
  Settings,
};

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const context = useAdmin();
  const partners = context?.partners || [];
  const currentAdmin = context?.currentAdmin || null;
  const logout = context?.logout || (() => {});

  const adminName = currentAdmin?.name || "Super Administrator";
  const adminRole = currentAdmin?.role || "Super Administrator";
  const initials = adminName
    ? adminName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SA";

  // Count pending verifications safely
  const pendingCount = Array.isArray(partners)
    ? partners.filter(
        (p) =>
          p?.verificationStatus === "Pending Verification" ||
          p?.verificationStatus === "Under Review" ||
          p?.verificationStatus === "Pending"
      ).length
    : 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-white border-r border-[#E9E4DB] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 px-5 border-b border-[#E9E4DB] flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B96F45] to-[#9F5935] flex items-center justify-center text-white font-serif font-black text-lg shadow-sm border border-[#A75F36]">
              ST
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wide text-[#292824] block leading-tight">
                {BRAND.name}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B96F45] block">
                Enterprise Admin
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F8F6F1] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#77746E]">
            Platform Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose && onClose()}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#F6ECE5] text-[#B96F45] shadow-[inset_0_0_0_1px_#EBD4C6]"
                    : "text-[#54514B] hover:text-[#292824] hover:bg-[#F8F6F1]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#B96F45]" : "text-[#77746E] group-hover:text-[#292824]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.href === "/admin/verification" && pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF6E9] text-[#9A6700] border border-[#F7E1B5]">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Admin User Card */}
        <div className="p-3 border-t border-[#E9E4DB] bg-[#FAF9F5]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E9E4DB] shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6] flex items-center justify-center font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-[#292824] block truncate">
                  {adminName}
                </span>
                <span className="text-[10px] text-[#77746E] block truncate">
                  {adminRole}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-[#77746E] hover:text-[#B3392E] hover:bg-[#FDECEB] transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
