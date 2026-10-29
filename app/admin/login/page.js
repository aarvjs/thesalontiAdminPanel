"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { BRAND } from "../../../lib/constants";
import { auth, db } from "../../../lib/firebase";
import { useAdmin } from "../../../context/AdminContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { addToast, isSuperAdmin, authLoading } = useAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in as Super Admin, redirect immediately
  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, isSuperAdmin, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError("Please enter a valid administrative work email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // 2. Verify Super Admin role from Cloud Firestore
      const adminRef = doc(db, "admins", user.uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists() || adminSnap.data().role !== "super_admin") {
        // Immediately sign out unauthorized users
        await signOut(auth);
        setError("Access Denied: This account is not provisioned as a Super Administrator.");
        setIsLoading(false);
        return;
      }

      const adminData = adminSnap.data();
      if (adminData.status === "suspended" || adminData.status === "inactive") {
        await signOut(auth);
        setError("Account Inactive: Your Super Administrator account has been suspended or deactivated.");
        setIsLoading(false);
        return;
      }

      // 3. Authorized Super Admin
      addToast(`Signed in successfully as ${adminData.name || "Super Administrator"}.`, "success");
      router.push("/admin/dashboard");
    } catch (err) {
      console.error("Super Admin sign-in error:", err);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid administrative credentials. Please verify your email and password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Access has been temporarily throttled for security. Please try again shortly.");
      } else if (err.code === "auth/user-disabled") {
        setError("This administrative account has been disabled by security operations.");
      } else if (err.code === "permission-denied") {
        setError("Firestore Security Rules rejected admin profile access. Please verify database rules.");
      } else {
        setError(err.message || "An unexpected error occurred during administrative sign in.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter your registered work email address first to receive a password reset link.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      addToast(`Password recovery link dispatched to ${email.trim()}.`, "info");
      setError("");
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No administrator account found with this email address.");
      } else {
        setError("Failed to send password recovery email. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F6F1]">
      {/* Left Column: Brand Editorial Showcase */}
      <div className="lg:w-1/2 relative bg-[#1E1C1A] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden min-h-[380px] lg:min-h-screen">
        {/* Background Salon Image with subtle dark gradient overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/salon_admin_hero.jpg"
            alt="The Salon Times Luxury Interior"
            fill
            className="object-cover object-center opacity-45 mix-blend-luminosity scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141311] via-[#1E1C1A]/70 to-[#1E1C1A]/40" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B96F45] to-[#9F5935] flex items-center justify-center font-serif font-black text-xl text-white shadow-lg border border-[#D9BD83]/30">
              ST
            </div>
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-wider block">
                {BRAND.name}
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#D9BD83] uppercase block">
                Enterprise Platform Console
              </span>
            </div>
          </div>
        </div>

        {/* Editorial statement */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-medium text-[#FBF8EE] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D9BD83]" />
            Official Platform Administration
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
            {BRAND.tagline}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#D5CEBF] font-light leading-relaxed">
            Verify partners, inspect documentation, manage feature permissions, and oversee salon discovery across India.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs">
            <div>
              <span className="font-bold text-lg text-[#FBF8EE] block">100%</span>
              <span className="text-[#A09D96]">Verified Partners</span>
            </div>
            <div>
              <span className="font-bold text-lg text-[#FBF8EE] block">12</span>
              <span className="text-[#A09D96]">Managed Branches</span>
            </div>
            <div>
              <span className="font-bold text-lg text-[#D9BD83] block">Active</span>
              <span className="text-[#A09D96]">Trust & Safety</span>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="relative z-10 pt-4 text-xs text-[#A09D96] flex items-center justify-between border-t border-white/10">
          <span>The Salon Times © 2026</span>
          <span className="text-[11px]">Kanpur • Gurugram • Delhi</span>
        </div>
      </div>

      {/* Right Column: Clean Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E9E4DB] shadow-xl p-8 sm:p-10">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B96F45]">
              Administrative Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292824] mt-1">
              Super Admin Sign In
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#77746E]">
              Authenticate with your verified Super Administrator credentials to access the platform console.
            </p>
          </div>

          {/* Inline Error */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#FDECEB] border border-[#F7C2BE] text-xs font-medium text-[#B3392E] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Work Email */}
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
                  placeholder="admin@thesalontimes.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-[#B96F45] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#77746E] hover:text-[#292824] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#B96F45] border-[#E9E4DB] focus:ring-[#B96F45] cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-xs text-[#54514B] font-medium">
                  Persist administrative session on this device
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#B96F45] hover:bg-[#9F5935] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Super Admin...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link to register */}
          <div className="mt-8 pt-6 border-t border-[#F3EFE8] flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-[#77746E]">
              Setting up platform administration for the first time?{" "}
              <Link
                href="/admin/register"
                className="font-semibold text-[#B96F45] hover:underline"
              >
                Provision Super Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
