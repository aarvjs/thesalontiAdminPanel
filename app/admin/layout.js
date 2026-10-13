"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AdminProvider } from "../../context/AdminContext";
import AdminLayout from "../../components/layout/AdminLayout";
import ToastContainer from "../../components/ui/ToastContainer";

function AdminLayoutInner({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";

  return isAuthPage ? (
    <div className="min-h-screen bg-[#F8F6F1]">
      {children}
      <ToastContainer />
    </div>
  ) : (
    <AdminLayout>{children}</AdminLayout>
  );
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
