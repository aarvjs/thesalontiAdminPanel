"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { INITIAL_PARTNERS } from "../data/partners-data";
import { INITIAL_SALONS } from "../data/salons-data";
import { INITIAL_BRANCHES } from "../data/branches-data";
import { INITIAL_BOOKINGS } from "../data/bookings-data";
import { INITIAL_SERVICES } from "../data/services-data";
import { INITIAL_CUSTOMERS } from "../data/customers-data";
import { INITIAL_LOGS } from "../data/activity-logs-data";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [partners, setPartners] = useState(INITIAL_PARTNERS);
  const [salons, setSalons] = useState(INITIAL_SALONS);
  const [branches] = useState(INITIAL_BRANCHES);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([
    {
      id: "ntf-1",
      title: "New partner registration: Apex Grooming Studio",
      time: "15m ago",
      read: false,
    },
    {
      id: "ntf-2",
      title: "Kabir Singh Rathore submitted Aadhaar Card for review",
      time: "1h ago",
      read: false,
    },
    {
      id: "ntf-3",
      title: "Doorstep booking BKG-903 confirmed in Kanpur",
      time: "2h ago",
      read: true,
    },
  ]);

  const [currentAdmin, setCurrentAdmin] = useState({
    name: "Sanjay Deshmukh",
    email: "sanjay.admin@thesalontimes.com",
    role: "Platform Administrator",
    department: "Trust & Safety Operations",
  });

  const [platformSettings, setPlatformSettings] = useState({
    platformName: "The Salon Times",
    supportEmail: "admin-desk@thesalontimes.com",
    commissionRate: 12,
    autoApproveDocs: false,
    enableHomeServicePlatformWide: true,
    maintenanceMode: false,
    minAdvanceBookingHours: 2,
  });

  // Toasts
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Activity Log helper
  const addLog = useCallback((action, target, targetType, details, result = "Success") => {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      actor: `Admin (${currentAdmin.name})`,
      action,
      target,
      targetType,
      details,
      result,
    };
    setLogs((prev) => [newLog, ...prev]);
  }, [currentAdmin.name]);

  // Partner actions
  const approvePartner = useCallback((partnerId) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          // Approve all its pending documents as well
          const updatedDocs = p.documents.map((d) => ({
            ...d,
            status: "Approved",
            reviewNotes: d.reviewNotes || "Verified and approved by admin.",
          }));
          return {
            ...p,
            verificationStatus: "Approved",
            accountStatus: "Active",
            documents: updatedDocs,
          };
        }
        return p;
      })
    );
    const partner = partners.find((p) => p.id === partnerId);
    const partnerName = partner ? partner.name : partnerId;
    addLog("PARTNER_APPROVED", partnerName, "Partner", `Partner ${partnerName} verified and approved.`, "Success");
    addToast(`Partner ${partnerName} approved successfully.`, "success");
  }, [partners, addLog, addToast]);

  const rejectPartner = useCallback((partnerId, reason = "Documents criteria not met") => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          return {
            ...p,
            verificationStatus: "Rejected",
            accountStatus: "Suspended",
          };
        }
        return p;
      })
    );
    const partner = partners.find((p) => p.id === partnerId);
    const partnerName = partner ? partner.name : partnerId;
    addLog("PARTNER_REJECTED", partnerName, "Partner", `Application rejected: ${reason}`, "Warning");
    addToast(`Partner ${partnerName} rejected. Reason: ${reason}`, "warning");
  }, [partners, addLog, addToast]);

  const suspendPartner = useCallback((partnerId, reason = "Administrative review") => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          return { ...p, accountStatus: "Suspended" };
        }
        return p;
      })
    );
    const partner = partners.find((p) => p.id === partnerId);
    const partnerName = partner ? partner.name : partnerId;
    addLog("PARTNER_SUSPENDED", partnerName, "Partner", `Suspended: ${reason}`, "Warning");
    addToast(`Account for ${partnerName} suspended.`, "warning");
  }, [partners, addLog, addToast]);

  const reactivatePartner = useCallback((partnerId) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          return { ...p, accountStatus: "Active" };
        }
        return p;
      })
    );
    const partner = partners.find((p) => p.id === partnerId);
    const partnerName = partner ? partner.name : partnerId;
    addLog("PARTNER_REACTIVATED", partnerName, "Partner", `Account reactivated to Active state.`, "Success");
    addToast(`Account for ${partnerName} reactivated.`, "success");
  }, [partners, addLog, addToast]);

  // Document verification actions
  const updateDocumentStatus = useCallback((partnerId, docId, status, reviewNotes) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          const updatedDocs = p.documents.map((d) => {
            if (d.id === docId) {
              return {
                ...d,
                status,
                reviewNotes: reviewNotes || d.reviewNotes,
              };
            }
            return d;
          });

          // Check if all docs are approved
          const allApproved = updatedDocs.every((d) => d.status === "Approved");
          const anyRejected = updatedDocs.some((d) => d.status === "Rejected");
          let newVerificationStatus = p.verificationStatus;
          if (allApproved) newVerificationStatus = "Approved";
          else if (anyRejected) newVerificationStatus = "Under Review";

          return {
            ...p,
            verificationStatus: newVerificationStatus,
            documents: updatedDocs,
          };
        }
        return p;
      })
    );

    addLog(
      `DOC_${status.toUpperCase()}`,
      `${partnerId} (${docId})`,
      "Document",
      `Document status updated to ${status}. Notes: ${reviewNotes || "None"}`,
      status === "Rejected" ? "Warning" : "Success"
    );
    addToast(`Document ${docId} marked as ${status}.`, status === "Rejected" ? "warning" : "success");
  }, [addLog, addToast]);

  const requestResubmission = useCallback((partnerId, docId, note) => {
    updateDocumentStatus(partnerId, docId, "Resubmission Requested", note);
  }, [updateDocumentStatus]);

  // Feature Permissions actions
  const togglePartnerPermission = useCallback((partnerId, featureKey) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          const currentVal = !!p.enabledFeatures?.[featureKey];
          return {
            ...p,
            enabledFeatures: {
              ...p.enabledFeatures,
              [featureKey]: !currentVal,
            },
          };
        }
        return p;
      })
    );
  }, []);

  const savePartnerPermissions = useCallback((partnerId, updatedFeatures) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partnerId) {
          return {
            ...p,
            enabledFeatures: updatedFeatures,
          };
        }
        return p;
      })
    );
    const partner = partners.find((p) => p.id === partnerId);
    const partnerName = partner ? partner.name : partnerId;
    addLog(
      "PERMISSIONS_UPDATED",
      partnerName,
      "Feature Permissions",
      `Permissions updated for ${partnerName}. Changes saved.`,
      "Success"
    );
    addToast(`Feature permissions updated for ${partnerName}.`, "success");
  }, [partners, addLog, addToast]);

  // Salon actions
  const toggleSalonStatus = useCallback((salonId) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id === salonId) {
          const newStatus = s.status === "Active" ? "Inactive" : "Active";
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
    const salon = salons.find((s) => s.id === salonId);
    const newStatus = salon && salon.status === "Active" ? "Inactive" : "Active";
    addToast(`Salon ${salon?.name || salonId} is now ${newStatus}.`, "info");
  }, [salons, addToast]);

  // Service actions
  const toggleServiceStatus = useCallback((serviceId) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          const newStatus = s.status === "Active" ? "Inactive" : "Active";
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
    const srv = services.find((s) => s.id === serviceId);
    const newStatus = srv && srv.status === "Active" ? "Inactive" : "Active";
    addToast(`Service "${srv?.name || serviceId}" status updated to ${newStatus}.`, "info");
  }, [services, addToast]);

  // Booking actions
  const updateBookingStatus = useCallback((bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    addToast(`Booking ${bookingId} marked as ${newStatus}.`, "success");
    addLog("BOOKING_STATUS_CHANGED", bookingId, "Booking", `Status set to ${newStatus}`, "Success");
  }, [addToast, addLog]);

  // Customer actions
  const toggleCustomerStatus = useCallback((customerId) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newStatus = c.status === "Active" ? "Blocked" : "Active";
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
    const cust = customers.find((c) => c.id === customerId);
    const newStatus = cust && cust.status === "Active" ? "Blocked" : "Active";
    addToast(`Customer ${cust?.name} account is now ${newStatus}.`, "info");
  }, [customers, addToast]);

  // Notifications
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast("All notifications marked as read.", "info");
  }, [addToast]);

  // Settings
  const updateSettings = useCallback((newSettings) => {
    setPlatformSettings((prev) => ({ ...prev, ...newSettings }));
    addToast("Platform settings saved successfully.", "success");
    addLog("SETTINGS_UPDATED", "Platform Settings", "Configuration", "Updated platform settings", "Success");
  }, [addToast, addLog]);

  const value = {
    partners,
    salons,
    branches,
    bookings,
    services,
    customers,
    logs,
    toasts,
    notifications,
    currentAdmin,
    platformSettings,
    addToast,
    removeToast,
    approvePartner,
    rejectPartner,
    suspendPartner,
    reactivatePartner,
    updateDocumentStatus,
    requestResubmission,
    togglePartnerPermission,
    savePartnerPermissions,
    toggleSalonStatus,
    toggleServiceStatus,
    updateBookingStatus,
    toggleCustomerStatus,
    markAllNotificationsRead,
    updateSettings,
    setCurrentAdmin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
