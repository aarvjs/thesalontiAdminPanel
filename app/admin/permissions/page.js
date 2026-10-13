"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Info } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import ToggleSwitch from "../../../components/ui/ToggleSwitch";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { FEATURE_MODULES } from "../../../lib/constants";
import { useAdmin } from "../../../context/AdminContext";

function PartnerPermissionsEditor({ currentPartner, onSave, addToast }) {
  const [draftPermissions, setDraftPermissions] = useState(
    currentPartner.enabledFeatures || {}
  );

  const hasUnsavedChanges =
    JSON.stringify(draftPermissions) !==
    JSON.stringify(currentPartner.enabledFeatures || {});

  const [modalState, setModalState] = useState({
    isOpen: false,
    featureKey: null,
    featureName: null,
  });

  const handleToggle = (key, featureName) => {
    const isCurrentlyEnabled = !!draftPermissions[key];

    if (
      isCurrentlyEnabled &&
      (key === "branchManagement" ||
        key === "homeService" ||
        key === "bookingManagement")
    ) {
      setModalState({
        isOpen: true,
        featureKey: key,
        featureName,
      });
      return;
    }

    setDraftPermissions((prev) => ({
      ...prev,
      [key]: !isCurrentlyEnabled,
    }));
  };

  const handleConfirmDisable = () => {
    if (modalState.featureKey) {
      setDraftPermissions((prev) => ({
        ...prev,
        [modalState.featureKey]: false,
      }));
    }
  };

  const handleSave = () => {
    onSave(currentPartner.id, draftPermissions);
  };

  const handleReset = () => {
    setDraftPermissions(currentPartner.enabledFeatures || {});
    addToast("Reverted unsaved permission changes.", "info");
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs p-6 space-y-6">
      {/* Partner Metadata Strip */}
      <div className="pb-5 border-b border-[#E9E4DB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B96F45]">
            Configuring Access For
          </span>
          <h2 className="text-lg font-serif font-bold text-[#292824] mt-0.5">
            {currentPartner.businessName}
          </h2>
          <p className="text-xs text-[#77746E] mt-0.5">
            Owner: {currentPartner.name} • Status:{" "}
            <strong className="text-[#292824]">
              {currentPartner.accountStatus}
            </strong>
          </p>
        </div>

        {hasUnsavedChanges && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF6E9] text-[#9A6700] border border-[#F7E1B5] self-start sm:self-center">
            ● Unsaved Changes
          </span>
        )}
      </div>

      {/* Module Toggles List */}
      <div className="divide-y divide-[#F3EFE8]">
        {FEATURE_MODULES.map((module) => {
          const isEnabled = !!draftPermissions[module.key];

          return (
            <div
              key={module.key}
              className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#292824]">
                    {module.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F8F6F1] border border-[#E9E4DB] text-[#77746E]">
                    {module.category}
                  </span>
                </div>
                <p className="text-xs text-[#77746E] mt-1 leading-relaxed">
                  {module.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    isEnabled ? "text-[#2D6A4F]" : "text-[#77746E]"
                  }`}
                >
                  {isEnabled ? "Enabled" : "Disabled"}
                </span>
                <ToggleSwitch
                  id={`perm-${module.key}`}
                  enabled={isEnabled}
                  onChange={() => handleToggle(module.key, module.name)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Save Button */}
      <div className="pt-4 border-t border-[#F3EFE8] flex items-center justify-between">
        <span className="text-xs text-[#77746E]">
          {hasUnsavedChanges
            ? "You have unsaved permission overrides."
            : "All partner permissions are saved and up to date."}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasUnsavedChanges}
            onClick={handleReset}
            className="px-3 py-2 text-xs font-medium text-[#292824] bg-white border border-[#E9E4DB] rounded-lg hover:bg-[#F8F6F1] transition-colors disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!hasUnsavedChanges}
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#B96F45] hover:bg-[#9F5935] rounded-lg shadow-sm transition-colors disabled:opacity-40 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Disabling Major Module Confirmation Dialog */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({ isOpen: false, featureKey: null, featureName: null })
        }
        onConfirm={handleConfirmDisable}
        type="warning"
        title={`Disable ${modalState.featureName}?`}
        message={`Disabling this core module will immediately prevent ${currentPartner?.name} from managing it in their partner app. No existing branch or booking data will be deleted.`}
        confirmText="Yes, Disable Feature"
        cancelText="Keep Enabled"
      />
    </div>
  );
}

function PermissionsContent() {
  const searchParams = useSearchParams();
  const preselectedPartnerId = searchParams?.get("partner");

  const { partners, savePartnerPermissions, addToast } = useAdmin();

  const [selectedPartnerId, setSelectedPartnerId] = useState(
    () => preselectedPartnerId || partners[0]?.id || ""
  );

  const currentPartner =
    partners.find((p) => p.id === selectedPartnerId) || partners[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Feature Permissions"
        subtitle="Control granular module access for verified partners across The Salon Times platform."
      />

      {/* Security Architecture Notice */}
      <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DB] text-xs text-[#77746E] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#B96F45] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-[#292824] block mb-0.5">
            Architecture & Security Note
          </span>
          Feature module flags configured here represent authorization policies.
          In production, these restrictions are enforced at API middleware and
          database security rule layers. Disabling a module hides it from the
          partner console but strictly preserves underlying records and customer
          history.
        </div>
      </div>

      {/* 2-Column Workspace: Left Partner Picker, Right Permissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Partner Selector List */}
        <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#77746E] mb-3 px-2">
            Select Salon Partner ({partners.length})
          </h3>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {partners.map((partner) => {
              const isSelected = partner.id === currentPartner?.id;
              const activeCount = Object.values(
                partner.enabledFeatures || {}
              ).filter(Boolean).length;

              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setSelectedPartnerId(partner.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#F6ECE5] border-[#EBD4C6] shadow-xs"
                      : "bg-white border-transparent hover:bg-[#FAF9F5] hover:border-[#E9E4DB]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#292824] truncate">
                      {partner.name}
                    </span>
                    <StatusBadge
                      status={partner.verificationStatus}
                      size="sm"
                      showDot={false}
                    />
                  </div>
                  <p className="text-[11px] text-[#77746E] truncate mt-0.5">
                    {partner.businessName}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#77746E]">
                    <span className="font-mono">
                      {partner.id} • {partner.city}
                    </span>
                    <span className="font-semibold text-[#B96F45]">
                      {activeCount}/10 modules
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Keyed Editor to automatically reset state when partner changes */}
        <div className="lg:col-span-2">
          {currentPartner ? (
            <PartnerPermissionsEditor
              key={currentPartner.id}
              currentPartner={currentPartner}
              onSave={savePartnerPermissions}
              addToast={addToast}
            />
          ) : (
            <div className="p-8 text-center text-xs text-[#77746E]">
              No partner selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeaturePermissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#77746E]">
          Loading feature permissions console...
        </div>
      }
    >
      <PermissionsContent />
    </Suspense>
  );
}
