"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { AdminProvider, useAdmin } from "../../context/AdminContext";
import AdminLayout from "../../components/layout/AdminLayout";
import ToastContainer from "../../components/ui/ToastContainer";

function AdminLayoutInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentAdmin, authLoading, isSuperAdmin, logout } = useAdmin();

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";

  // Redirect to dashboard if logged in as Super Admin on login/register pages
  useEffect(() => {
    if (!authLoading && isSuperAdmin && isAuthPage) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, isSuperAdmin, isAuthPage, router]);

  // Redirect to login if unauthenticated on protected pages
  useEffect(() => {
    if (!authLoading && !currentUser && !isAuthPage) {
      router.replace("/admin/login");
    }
  }, [authLoading, currentUser, isAuthPage, router]);

  // Auth pages (login/register)
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        {children}
        <ToastContainer />
      </div>
    );
  }

  // Loading state during authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B96F45] to-[#9F5935] flex items-center justify-center text-white shadow-xl mb-6 border border-[#A75F36]/30 animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#292824] mb-1">
          <Loader2 className="w-4 h-4 animate-spin text-[#B96F45]" />
          <span>Verifying Platform Credentials</span>
        </div>
        <p className="text-xs text-[#77746E] max-w-sm">
          Securing session with Firebase Authentication and validating Super Administrator authorization...
        </p>
      </div>
    );
  }

  // If unauthenticated on protected page, show redirecting state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#B96F45] mb-3" />
        <p className="text-xs font-semibold text-[#77746E]">
          Redirecting to Administrator Sign In...
        </p>
      </div>
    );
  }

  // Authenticated in Firebase Auth, but unauthorized (not a Super Admin)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E9E4DB] shadow-2xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FDECEB] border border-[#F7C2BE] flex items-center justify-center text-[#B3392E] mb-6 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B3392E] block mb-1">
            403 Security Boundary
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#292824] mb-2">
            Super Administrator Required
          </h1>
          <p className="text-xs text-[#77746E] leading-relaxed mb-6">
            You are currently signed in as{" "}
            <span className="font-semibold text-[#292824]">{currentUser.email}</span>.
            However, this account has not been provisioned with the{" "}
            <span className="font-mono text-[#B96F45]">super_admin</span> role in Cloud Firestore.
            Access to platform operations, partner verifications, and financial controls is strictly denied.
          </p>

          <button
            type="button"
            onClick={logout}
            className="w-full py-3 px-4 bg-[#B96F45] hover:bg-[#9F5935] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Return to Login</span>
          </button>
        </div>
      </div>
    );
  }

  // Authorized Super Admin: Render layout & page
  return <AdminLayout>{children}</AdminLayout>;
}

export default function AdminRootLayout({ children }) {
  return (
    <AdminProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#F8F6F1]" />}>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </Suspense>
    </AdminProvider>
  );
}
