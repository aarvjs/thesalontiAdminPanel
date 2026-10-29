"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { auth, db } from "../../../lib/firebase";
import { useAdmin } from "../../../context/AdminContext";

export default function AdminRegisterPage() {
  const router = useRouter();
  const { addToast, checkSetupStatus } = useAdmin();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isAlreadySetup, setIsAlreadySetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check on mount whether Super Admin is already registered in Firestore
  useEffect(() => {
    let isMounted = true;
    async function verifyInitialSetup() {
      try {
        const setupRef = doc(db, "system", "admin_setup");
        const setupSnap = await getDoc(setupRef);

        if (isMounted) {
          if (setupSnap.exists()) {
            setIsAlreadySetup(true);
          } else {
            setIsAlreadySetup(false);
          }
        }
      } catch (err) {
        console.warn("Notice checking admin_setup document:", err.message);
        // If permission-denied or error, assume it might not be initialized yet
        if (isMounted) setIsAlreadySetup(false);
      } finally {
        if (isMounted) setIsCheckingSetup(false);
      }
    }

    verifyInitialSetup();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Please provide your full administrator legal name (at least 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError("Please provide a valid administrative work email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Enterprise Data Security & Master Administration Protocol.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Double-check before starting auth whether setup is already locked
      const setupRef = doc(db, "system", "admin_setup");
      const checkSnap = await getDoc(setupRef);
      if (checkSnap.exists()) {
        setIsAlreadySetup(true);
        setIsLoading(false);
        setError("Super Admin registration is permanently closed. A platform administrator already exists.");
        return;
      }

      // 2. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // 3. Update Firebase Auth display name
      await updateProfile(user, {
        displayName: fullName.trim(),
      });

      // 4. Execute atomic Firestore transaction to provision Super Admin and lock future registrations
      await runTransaction(db, async (transaction) => {
        const freshSetupSnap = await transaction.get(setupRef);
        if (freshSetupSnap.exists()) {
          throw new Error("SUPER_ADMIN_ALREADY_EXISTS");
        }

        const adminRef = doc(db, "admins", user.uid);

        // Lock document: system/admin_setup
        transaction.set(setupRef, {
          superAdminUid: user.uid,
          email: user.email,
          role: "super_admin",
          initializedAt: serverTimestamp(),
        });

        // Admin profile: admins/{uid}
        transaction.set(adminRef, {
          uid: user.uid,
          name: fullName.trim(),
          email: user.email,
          role: "super_admin",
          department: "Executive Platform Administration",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // 5. Success
      await checkSetupStatus();
      addToast("Super Administrator provisioned and signed in successfully.", "success");
      router.push("/admin/dashboard");
    } catch (err) {
      console.error("Super Admin registration error:", err);

      if (err.message === "SUPER_ADMIN_ALREADY_EXISTS") {
        await signOut(auth);
        setIsAlreadySetup(true);
        setError("Registration permanently closed: A Super Administrator has already been provisioned.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email address is already registered in Firebase Authentication. Please sign in or use another email.");
      } else if (err.code === "auth/weak-password") {
        setError("The password provided is too weak. Please use at least 8 characters with numbers or symbols.");
      } else if (err.code === "auth/invalid-email") {
        setError("The email address is improperly formatted.");
      } else if (err.code === "permission-denied") {
        setError("Firestore Security Rules rejected the operation. Ensure the initial setup rules are configured.");
      } else {
        setError(err.message || "An unexpected error occurred during Super Admin provisioning. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
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
            Super Administrator Setup
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#77746E] max-w-md mx-auto">
            Provision the master platform administrator with full authority over partner verifications, salons, and security policies.
          </p>
        </div>

        {/* Loading setup state */}
        {isCheckingSetup ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#B96F45] mb-3" />
            <p className="text-xs font-medium text-[#77746E]">
              Verifying platform security initialization status...
            </p>
          </div>
        ) : isAlreadySetup ? (
          /* State: Super Admin Already Exists -> Permanently Disabled */
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#FEF6E9] border border-[#F7E1B5] text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#F6ECE5] border border-[#EBD4C6] flex items-center justify-center text-[#B96F45]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#292824]">
                Super Admin Registration Permanently Closed
              </h2>
              <p className="text-xs text-[#77746E] leading-relaxed max-w-md mx-auto">
                A Super Administrator account has already been initialized and verified in Cloud Firestore.
                To protect platform security and prevent unauthorized privilege escalation, further public registration is permanently disabled.
              </p>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/admin/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#B96F45] hover:bg-[#9F5935] text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Proceed to Administrator Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* State: Initial One-Time Registration Form */
          <>
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
                  Administrator Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Arvind Yadav"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                    placeholder="arvindyadav70075@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                    required
                    disabled={isLoading}
                  />
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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#77746E] absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#F8F6F1] border border-[#E9E4DB] rounded-xl text-[#292824] placeholder-[#A09D96] focus:outline-none focus:border-[#B96F45] focus:bg-white focus:ring-2 focus:ring-[#B96F45]/15 transition-all"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-[#77746E] hover:text-[#292824] transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
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
                    disabled={isLoading}
                  />
                  <span className="text-xs text-[#54514B] leading-relaxed">
                    I acknowledge that this action establishes the master Super Administrator identity for The Salon Times platform. All actions taken by this account are immutably audited.
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning Super Administrator...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Super Administrator</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#F3EFE8] text-center text-xs text-[#77746E]">
              Already an authorized administrator?{" "}
              <Link href="/admin/login" className="font-semibold text-[#B96F45] hover:underline">
                Sign In to Console
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
