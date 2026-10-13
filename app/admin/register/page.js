"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, Phone, ShieldAlert, ArrowRight } from "lucide-react";
import { useAdmin } from "../../../context/AdminContext";

export default function AdminRegisterPage() {
  const router = useRouter();
  const { addToast } = useAdmin();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please provide your full legal name.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please provide a valid administrative work email address.");
      return;
    }

    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Enterprise Data Security & Confidentiality Agreement.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      addToast(
        "Onboarding application recorded. In production, Super-Admin authorization is required before access is granted.",
        "success"
      );
      router.push("/admin/login");
    }, 700);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-[#F8F6F1]">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E9E4DB] shadow-xl p-8 sm:p-12">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#B96F45] to-[#9F5935] flex items-center justify-center font-serif font-black text-2xl text-white shadow-md border border-[#A75F36] mb-3">
            ST
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B96F45] block">
            The Salon Times
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292824] mt-1">
            Admin Staff Onboarding Request
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#77746E] max-w-md mx-auto">
            Submit your personnel registration to request administrative access to the platform console.
          </p>
        </div>

        {/* Security Alert Note */}
        <div className="mb-6 p-4 rounded-2xl bg-[#FEF6E9] border border-[#F7E1B5] text-xs text-[#9A6700] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#B96F45]" />
          <div>
            <span className="font-bold text-[#7E5400] block mb-0.5">
              Production Security Policy Note
            </span>
            Account creation and elevated administrator privileges are strictly controlled via server-side identity verification. Submitting this form simulates the onboarding request in the UI demo.
          </div>
        </div>

        {/* Inline Error */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#FDECEB] border border-[#F7C2BE] text-xs font-medium text-[#B3392E] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                required
              />
            </div>
          </div>

          {/* Grid: Email & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@thesalontimes.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Contact Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98390 00000"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Grid: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Password (Min 8 Chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#77746E] hover:text-[#292824] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[#B96F45] border-[#E9E4DB] focus:ring-[#B96F45] cursor-pointer mt-0.5"
              />
              <span className="text-xs text-[#54514B] leading-relaxed">
                I agree to the <strong>Enterprise Security & Data Confidentiality Protocol</strong>. I acknowledge that all actions on this console are immutably logged to an audit trail.
              </span>
            </label>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 px-4 bg-[#B96F45] hover:bg-[#9F5935] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span>Submitting application...</span>
            ) : (
              <>
                <span>Submit Onboarding Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#F3EFE8] text-center text-xs text-[#77746E]">
          Already an authorized administrator?{" "}
          <Link href="/admin/login" className="font-semibold text-[#B96F45] hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
