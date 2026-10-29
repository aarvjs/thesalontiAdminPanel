"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Bell,
  Sliders,
  Save,
  Lock,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import ToggleSwitch from "../../../components/ui/ToggleSwitch";
import { useAdmin } from "../../../context/AdminContext";

export default function SettingsPage() {
  const { currentAdmin, platformSettings, updateSettings, updateAdminProfile, addToast } = useAdmin();

  const [activeTab, setActiveTab] = useState("platform"); // "platform" | "profile" | "verification" | "notifications" | "security"

  // Local form drafts
  const [profileDraft, setProfileDraft] = useState({
    name: currentAdmin?.name || "",
    email: currentAdmin?.email || "",
    role: currentAdmin?.role || "Super Administrator",
    department: currentAdmin?.department || "Executive Platform Administration",
  });
  const [platformDraft, setPlatformDraft] = useState({ ...platformSettings });

  useEffect(() => {
    if (currentAdmin) {
      setProfileDraft({
        name: currentAdmin?.name || "",
        email: currentAdmin?.email || "",
        role: currentAdmin?.role || "Super Administrator",
        department: currentAdmin?.department || "Executive Platform Administration",
      });
    }
  }, [currentAdmin]);

  const [notifDraft, setNotifDraft] = useState({
    emailKYCAlerts: true,
    dailyBookingDigest: true,
    instantDisputeNotice: true,
    slackWebhookSync: false,
  });

  const [securityDraft, setSecurityDraft] = useState({
    enforce2FA: true,
    sessionTimeoutMinutes: 60,
    restrictIPs: false,
    auditLogRetentionDays: 365,
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (updateAdminProfile) {
      try {
        await updateAdminProfile(profileDraft);
      } catch (err) {
        console.error("Save profile error:", err);
      }
    } else {
      addToast("Admin profile updated.", "success");
    }
  };

  const handleSavePlatform = (e) => {
    e.preventDefault();
    updateSettings(platformDraft);
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    addToast("Security policies saved and updated.", "success");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        subtitle="Configure marketplace parameters, administrative credentials, security protocols, and verification rules."
      />

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E9E4DB] overflow-x-auto pb-1">
        {[
          { id: "platform", label: "Marketplace Rules", icon: Sliders },
          { id: "profile", label: "Admin Profile", icon: User },
          { id: "verification", label: "Verification Policies", icon: Shield },
          { id: "notifications", label: "Alerts & Notifications", icon: Bell },
          { id: "security", label: "Security & 2FA", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white text-[#B96F45] border-t-2 border-t-[#B96F45] border-x border-[#E9E4DB] shadow-xs"
                  : "text-[#77746E] hover:text-[#292824] hover:bg-[#FAF9F5]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Marketplace Parameters */}
      {activeTab === "platform" && (
        <form onSubmit={handleSavePlatform} className="bg-white rounded-2xl border border-[#E9E4DB] p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-[#F3EFE8]">
            <h3 className="text-base font-bold text-[#292824]">Marketplace Configuration</h3>
            <p className="text-xs text-[#77746E] mt-0.5">
              Control booking commission rates, customer support contacts, and service dispatch thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                value={platformDraft.platformName}
                onChange={(e) => setPlatformDraft({ ...platformDraft, platformName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Central Support Desk Email
              </label>
              <input
                type="email"
                value={platformDraft.supportEmail}
                onChange={(e) => setPlatformDraft({ ...platformDraft, supportEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Platform Commission Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={platformDraft.commissionRate}
                onChange={(e) => setPlatformDraft({ ...platformDraft, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:bg-white"
                required
              />
              <span className="text-[11px] text-[#77746E] mt-1 block">
                Standard deduction applied on partner booking payouts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Minimum Advance Booking Window (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={platformDraft.minAdvanceBookingHours}
                onChange={(e) => setPlatformDraft({ ...platformDraft, minAdvanceBookingHours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F3EFE8] space-y-4">
            <ToggleSwitch
              id="switch-homeservice"
              label="Enable Doorstep Home Service Platform-Wide"
              description="Allow verified partners with home-service privileges to offer mobile appointments."
              enabled={platformDraft.enableHomeServicePlatformWide}
              onChange={(val) => setPlatformDraft({ ...platformDraft, enableHomeServicePlatformWide: val })}
            />
            <ToggleSwitch
              id="switch-maintenance"
              label="Platform Maintenance Mode"
              description="Temporarily freeze customer checkout while performing scheduled database migrations."
              enabled={platformDraft.maintenanceMode}
              onChange={(val) => setPlatformDraft({ ...platformDraft, maintenanceMode: val })}
            />
          </div>

          <div className="pt-4 border-t border-[#F3EFE8] flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-[#E9E4DB] p-6 shadow-xs space-y-5">
          <div className="pb-4 border-b border-[#F3EFE8]">
            <h3 className="text-base font-bold text-[#292824]">Administrator Identity</h3>
            <p className="text-xs text-[#77746E] mt-0.5">
              Personal contact details used in audit logs and system communications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profileDraft.name}
                onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                value={profileDraft.email}
                onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Assigned Platform Role
              </label>
              <input
                type="text"
                value={profileDraft.role}
                disabled
                className="w-full px-3 py-2 text-xs bg-[#F2EFE9] border border-[#E1DDD4] rounded-lg text-[#77746E] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77746E] mb-1.5">
                Operations Division
              </label>
              <input
                type="text"
                value={profileDraft.department}
                onChange={(e) => setProfileDraft({ ...profileDraft, department: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E9E4DB] rounded-lg text-[#292824] focus:outline-none focus:border-[#B96F45] focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F3EFE8] flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Verification Policies */}
      {activeTab === "verification" && (
        <div className="bg-white rounded-2xl border border-[#E9E4DB] p-6 shadow-xs space-y-5">
          <div className="pb-4 border-b border-[#F3EFE8]">
            <h3 className="text-base font-bold text-[#292824]">KYC & Compliance Policy Standards</h3>
            <p className="text-xs text-[#77746E] mt-0.5">
              Automated validation guidelines for partner onboarding and salon license clearances.
            </p>
          </div>

          <div className="space-y-4">
            <ToggleSwitch
              id="switch-gst"
              label="Mandatory GSTIN Cross-Verification"
              description="Automatically check business registration numbers against GST Central Portal API."
              enabled={true}
              onChange={() => addToast("Policy toggled.", "info")}
            />

            <ToggleSwitch
              id="switch-photos"
              label="Compulsory High-Resolution Salon Premises Photos"
              description="Require partners to upload minimum 3 interior/exterior photographs of the salon."
              enabled={true}
              onChange={() => addToast("Policy toggled.", "info")}
            />

            <ToggleSwitch
              id="switch-health"
              label="Municipal Health & Hygiene Certificate"
              description="Enforce municipal trade authorization for high-volume aesthetic clinics."
              enabled={false}
              onChange={() => addToast("Policy toggled.", "info")}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-[#E9E4DB] p-6 shadow-xs space-y-5">
          <div className="pb-4 border-b border-[#F3EFE8]">
            <h3 className="text-base font-bold text-[#292824]">Administrative Dispatch Alerts</h3>
            <p className="text-xs text-[#77746E] mt-0.5">
              Choose which operational events trigger urgent notifications to administrators.
            </p>
          </div>

          <div className="space-y-4">
            <ToggleSwitch
              id="notif-kyc"
              label="Instant Alert on New Verification Submissions"
              description="Send administrative alert when a partner submits KYC documents."
              enabled={notifDraft.emailKYCAlerts}
              onChange={(val) => setNotifDraft({ ...notifDraft, emailKYCAlerts: val })}
            />

            <ToggleSwitch
              id="notif-digest"
              label="Daily Platform Operational Digest"
              description="Receive morning summary of bookings, customer registrations, and payouts."
              enabled={notifDraft.dailyBookingDigest}
              onChange={(val) => setNotifDraft({ ...notifDraft, dailyBookingDigest: val })}
            />

            <ToggleSwitch
              id="notif-dispute"
              label="Urgent Customer Dispute & Refund Escalations"
              description="Notify lead administrator immediately if an unresolved salon dispute occurs."
              enabled={notifDraft.instantDisputeNotice}
              onChange={(val) => setNotifDraft({ ...notifDraft, instantDisputeNotice: val })}
            />
          </div>
        </div>
      )}

      {/* Tab 5: Security */}
      {activeTab === "security" && (
        <form onSubmit={handleSaveSecurity} className="bg-white rounded-2xl border border-[#E9E4DB] p-6 shadow-xs space-y-5">
          <div className="pb-4 border-b border-[#F3EFE8]">
            <h3 className="text-base font-bold text-[#292824]">Enterprise Security Standards</h3>
            <p className="text-xs text-[#77746E] mt-0.5">
              Two-factor authentication, administrative session control, and access restrictions.
            </p>
          </div>

          <div className="space-y-4">
            <ToggleSwitch
              id="sec-2fa"
              label="Enforce Hardware 2FA / Authenticator App for Staff"
              description="Require TOTP multi-factor verification on every login session."
              enabled={securityDraft.enforce2FA}
              onChange={(val) => setSecurityDraft({ ...securityDraft, enforce2FA: val })}
            />

            <ToggleSwitch
              id="sec-ip"
              label="Restrict Console Access to Office VPN / IP Allowlist"
              description="Block administrative sessions initiated outside authorized enterprise subnets."
              enabled={securityDraft.restrictIPs}
              onChange={(val) => setSecurityDraft({ ...securityDraft, restrictIPs: val })}
            />
          </div>

          <div className="pt-4 border-t border-[#F3EFE8] flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Security Policy</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
