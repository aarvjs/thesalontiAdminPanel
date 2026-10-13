"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";

export default function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentAdmin, notifications, markAllNotificationsRead, addToast } = useAdmin();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle global search Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/partners?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Humanize title from route
  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    if (pathname.includes("/partners/")) return "Partner Profile Details";
    if (pathname.endsWith("/partners")) return "Salon Partners";
    if (pathname.endsWith("/verification")) return "Document Verification";
    if (pathname.endsWith("/salons")) return "Salons Directory";
    if (pathname.endsWith("/branches")) return "Branch Operations";
    if (pathname.endsWith("/bookings")) return "Bookings & Appointments";
    if (pathname.endsWith("/services")) return "Platform Services";
    if (pathname.endsWith("/customers")) return "Customers Overview";
    if (pathname.endsWith("/permissions")) return "Feature Permissions Control";
    if (pathname.endsWith("/activity-logs")) return "Administrative Activity Logs";
    if (pathname.endsWith("/settings")) return "Platform Settings";
    return "Administrative Overview";
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-xs border-b border-[#E9E4DB] flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & breadcrumb / page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F8F6F1] lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#77746E] font-medium hidden sm:flex">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#B96F45] font-semibold">{getPageTitle()}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-[#292824] leading-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Search, Notifications, Profile Menu */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-[#77746E] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners, salons, bookings..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white transition-all"
          />
        </form>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F8F6F1] border border-[#E9E4DB] transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B3392E] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E9E4DB] shadow-2xl p-4 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-[#F3EFE8]">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#292824]">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F6ECE5] text-[#B96F45]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-semibold text-[#B96F45] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#F3EFE8] max-h-72 overflow-y-auto mt-2">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`py-2.5 px-2 rounded-lg text-xs transition-colors ${
                      item.read ? "text-[#77746E]" : "bg-[#FAF8F5] text-[#292824] font-medium"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 leading-relaxed">{item.title}</p>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#B96F45] shrink-0 mt-1" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#A09D96] mt-1 block">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F3EFE8] text-center mt-2">
                <Link
                  href="/admin/activity-logs"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-[#B96F45] hover:underline"
                >
                  View full activity log →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-[#E9E4DB] hover:bg-[#F8F6F1] transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#B96F45] to-[#9F5935] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              SD
            </div>
            <span className="text-xs font-bold text-[#292824] hidden sm:block">
              {currentAdmin.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#77746E] hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E9E4DB] shadow-2xl p-2 z-50 animate-in fade-in duration-100">
              <div className="p-2 border-b border-[#F3EFE8]">
                <p className="text-xs font-bold text-[#292824]">{currentAdmin.name}</p>
                <p className="text-[10px] text-[#77746E] truncate">{currentAdmin.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-[#F6ECE5] text-[#B96F45]">
                  {currentAdmin.role}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#292824] hover:bg-[#F8F6F1] rounded-lg transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#77746E]" />
                  Platform Settings
                </Link>
                <Link
                  href="/admin/activity-logs"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#292824] hover:bg-[#F8F6F1] rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#77746E]" />
                  Audit Trail
                </Link>
              </div>

              <div className="pt-1 border-t border-[#F3EFE8]">
                <Link
                  href="/admin/login"
                  onClick={() => {
                    setShowUserMenu(false);
                    addToast("Logged out of Admin Portal", "info");
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#B3392E] hover:bg-[#FDECEB] rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
