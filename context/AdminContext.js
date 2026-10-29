"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { INITIAL_SALONS } from "../data/salons-data";
import { INITIAL_BRANCHES } from "../data/branches-data";
import { INITIAL_BOOKINGS } from "../data/bookings-data";
import { INITIAL_SERVICES } from "../data/services-data";
import { INITIAL_CUSTOMERS } from "../data/customers-data";
import { INITIAL_LOGS } from "../data/activity-logs-data";

const AdminContext = createContext(null);

// Helper to normalize and format Firestore partner documents
function formatPartnerDoc(id, data) {
  const parseDate = (val) => {
    if (!val) return null;
    if (val.toDate) return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    return val;
  };

  const normalizeStatus = (val) => {
    if (!val) return "Draft";
    const s = String(val).toLowerCase().replace(/-/g, "_").replace(/ /g, "_");
    if (s === "approved" || s === "verified") return "Approved";
    if (s === "rejected") return "Rejected";
    if (s === "underreview" || s === "under_review") return "Under Review";
    if (s === "needsinfo" || s === "needs_info") return "Action Required";
    if (s === "submitted" || s === "pending") return "Pending";
    if (s === "notsubmitted" || s === "not_submitted") return "Draft";
    return val;
  };

  const normalizeDocStatus = (val) => {
    if (!val) return "Submitted";
    const s = String(val).toLowerCase();
    if (s === "approved" || s === "verified") return "Approved";
    if (s === "rejected") return "Rejected";
    if (s === "underreview" || s === "under_review") return "Under Review";
    if (s === "resubmission_requested" || s === "needs_info") return "Resubmission Requested";
    return "Submitted";
  };

  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const docs = Array.isArray(data.documents)
    ? data.documents.map((d, index) => ({
        id: d.id || `doc-${index}`,
        type: d.documentType || d.type || "Document Proof",
        documentType: d.documentType || d.type || "Document Proof",
        name: d.fileName || d.name || "document.pdf",
        fileName: d.fileName || d.name || "document.pdf",
        documentNumber: d.documentNumber || "",
        fileUrl: d.fileUrl || d.url || null,
        url: d.fileUrl || d.url || null,
        fileSize: d.fileSize || null,
        size: d.fileSize ? formatBytes(d.fileSize) : (d.size || "1.2 MB"),
        uploadDate: parseDate(d.uploadDate) || parseDate(data.submittedAt) || parseDate(data.createdAt),
        status: normalizeDocStatus(d.status),
        reviewNotes: d.reviewNotes || null,
      }))
    : [];

  const rawStatus = data.verificationStatus || "not_submitted";
  const displayStatus = normalizeStatus(rawStatus);

  return {
    id: id,
    uid: id,
    name: data.fullName || data.name || data.legalName || "Partner Applicant",
    fullName: data.fullName || data.name || "",
    legalName: data.legalName || data.fullName || "",
    businessName: data.businessName || "Registered Salon",
    email: data.email || "",
    phone: data.phoneNumber || data.phone || "",
    phoneNumber: data.phoneNumber || data.phone || "",
    businessType: data.businessType || "Proprietorship",
    regNumber: data.regNumber || "",
    businessAddress: data.businessAddress || "",
    city: data.city || data.businessAddress?.split(",")?.slice(-2)?.[0]?.trim() || "Kanpur",
    verificationStatus: displayStatus,
    rawVerificationStatus: rawStatus,
    accountStatus: data.accountStatus || (displayStatus === "Approved" ? "Active" : "Under Review"),
    rejectionReason: data.rejectionReason || null,
    submittedAt: parseDate(data.submittedAt) || parseDate(data.createdAt),
    reviewedAt: parseDate(data.reviewedAt),
    reviewedBy: data.reviewedBy || null,
    reviewerEmail: data.reviewerEmail || null,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    documents: docs,
    enabledFeatures: data.enabledFeatures || {
      homeService: true,
      staffManagement: true,
      customPackages: true,
      instantPayout: false,
      marketingCampaigns: false,
    },
  };
}

export function AdminProvider({ children }) {
  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(null);

  // Live Firestore Partners State
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState(null);

  // Platform operational state
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
      title: "New partner registration submitted",
      time: "15m ago",
      read: false,
    },
    {
      id: "ntf-2",
      title: "Partner verification document inspection pending",
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

  // Check if one-time super admin registration has already been completed
  const checkSetupStatus = useCallback(async () => {
    try {
      const setupRef = doc(db, "system", "admin_setup");
      const snap = await getDoc(setupRef);
      const exists = snap.exists();
      setIsSetupComplete(exists);
      return exists;
    } catch (err) {
      console.warn("Setup status check notice:", err.message);
      return false;
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    checkSetupStatus();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const adminRef = doc(db, "admins", user.uid);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists() && adminSnap.data().role === "super_admin") {
            const adminData = adminSnap.data();
            setCurrentAdmin({
              uid: user.uid,
              name: adminData.name || user.displayName || "Super Administrator",
              email: user.email,
              role: "Super Administrator",
              actualRole: adminData.role,
              department: adminData.department || "Executive Platform Administration",
              status: adminData.status || "active",
              createdAt: adminData.createdAt,
            });
          } else {
            setCurrentAdmin(null);
          }
        } catch (err) {
          console.error("Error fetching Super Admin profile:", err);
          setCurrentAdmin(null);
        }
      } else {
        setCurrentUser(null);
        setCurrentAdmin(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [checkSetupStatus]);

  // Subscribe to real-time Cloud Firestore 'partners' collection for authorized Super Admin
  useEffect(() => {
    if (!currentUser || !currentAdmin) {
      setPartnersLoading(false);
      return;
    }

    setPartnersLoading(true);
    setPartnersError(null);

    const partnersColl = collection(db, "partners");
    const unsubscribe = onSnapshot(
      partnersColl,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push(formatPartnerDoc(docSnap.id, docSnap.data()));
        });
        setPartners(list);
        setPartnersLoading(false);
      },
      (err) => {
        console.error("Firestore partners onSnapshot error:", err);
        setPartnersError(err.message || "Failed to load partner applications from Cloud Firestore");
        setPartnersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, currentAdmin]);

  // Secure Logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentAdmin(null);
      addToast("Signed out of Admin Console.", "info");
    } catch (err) {
      console.error("Logout error:", err);
      addToast("Failed to sign out properly.", "error");
    }
  }, [addToast]);

  // Update admin profile in Firestore & Firebase Auth
  const updateAdminProfile = useCallback(
    async (updatedFields) => {
      if (!currentUser) return;
      try {
        if (updatedFields.name && updatedFields.name !== currentUser.displayName) {
          await updateProfile(currentUser, { displayName: updatedFields.name.trim() });
        }
        const adminRef = doc(db, "admins", currentUser.uid);
        await updateDoc(adminRef, {
          name: updatedFields.name?.trim(),
          department: updatedFields.department?.trim() || "Executive Platform Administration",
          updatedAt: serverTimestamp(),
        });
        setCurrentAdmin((prev) => ({
          ...prev,
          name: updatedFields.name?.trim() || prev?.name,
          department: updatedFields.department?.trim() || prev?.department,
        }));
        addToast("Super Admin profile updated successfully.", "success");
      } catch (err) {
        console.error("Error updating admin profile in Firestore:", err);
        addToast("Failed to update profile in database.", "error");
        throw err;
      }
    },
    [currentUser, addToast]
  );

  // Activity Log helper
  const addLog = useCallback(
    (action, target, targetType, details, result = "Success") => {
      const actorName = currentAdmin?.name || "Super Admin";
      const newLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        actor: `Admin (${actorName})`,
        action,
        target,
        targetType,
        details,
        result,
      };
      setLogs((prev) => [newLog, ...prev]);
    },
    [currentAdmin]
  );

  // --------------------------------------------------------------------------
  // Real Firestore Partner Verification Actions
  // --------------------------------------------------------------------------

  // 1. APPROVE Partner Application
  const approvePartner = useCallback(
    async (partnerId) => {
      const targetPartner = partners.find((p) => p.id === partnerId);
      const partnerName = targetPartner?.businessName || targetPartner?.name || partnerId;

      try {
        const partnerRef = doc(db, "partners", partnerId);

        // Mark all attached documents as approved
        const currentDocs = targetPartner?.documents || [];
        const updatedDocs = currentDocs.map((d) => ({
          id: d.id,
          documentType: d.documentType || d.type,
          fileName: d.fileName || d.name,
          documentNumber: d.documentNumber || "",
          fileUrl: d.fileUrl || d.url || "",
          fileSize: d.fileSize || null,
          uploadDate: d.uploadDate ? new Date(d.uploadDate) : new Date(),
          status: "approved",
          reviewNotes: d.reviewNotes || "Verified and approved by Super Administrator.",
        }));

        await updateDoc(partnerRef, {
          verificationStatus: "approved",
          accountStatus: "Active",
          reviewedAt: serverTimestamp(),
          reviewedBy: currentUser?.uid || "super_admin",
          reviewerEmail: currentUser?.email || "admin@thesalontimes.com",
          rejectionReason: null,
          documents: updatedDocs,
          updatedAt: serverTimestamp(),
        });

        addLog(
          "PARTNER_APPROVED",
          partnerName,
          "Partner",
          `Partner ${partnerName} verified and approved by Super Admin.`,
          "Success"
        );
        addToast(`Partner ${partnerName} approved successfully. Verified status is now live.`, "success");
      } catch (err) {
        console.error("Error approving partner in Firestore:", err);
        addToast(`Approval failed: ${err.message}`, "error");
        throw err;
      }
    },
    [partners, currentUser, addLog, addToast]
  );

  // 2. REJECT Partner Application (Requires Reason)
  const rejectPartner = useCallback(
    async (partnerId, reason = "Documents criteria not met") => {
      if (!reason || !reason.trim()) {
        addToast("A rejection reason is strictly required.", "warning");
        return;
      }

      const targetPartner = partners.find((p) => p.id === partnerId);
      const partnerName = targetPartner?.businessName || targetPartner?.name || partnerId;

      try {
        const partnerRef = doc(db, "partners", partnerId);

        await updateDoc(partnerRef, {
          verificationStatus: "rejected",
          accountStatus: "Suspended",
          rejectionReason: reason.trim(),
          reviewedAt: serverTimestamp(),
          reviewedBy: currentUser?.uid || "super_admin",
          reviewerEmail: currentUser?.email || "admin@thesalontimes.com",
          updatedAt: serverTimestamp(),
        });

        addLog(
          "PARTNER_REJECTED",
          partnerName,
          "Partner",
          `Application rejected: ${reason.trim()}`,
          "Warning"
        );
        addToast(`Partner ${partnerName} rejected. Rejection reason saved to database.`, "warning");
      } catch (err) {
        console.error("Error rejecting partner in Firestore:", err);
        addToast(`Rejection failed: ${err.message}`, "error");
        throw err;
      }
    },
    [partners, currentUser, addLog, addToast]
  );

  // 3. Mark Partner Application Under Review
  const setPendingReview = useCallback(
    async (partnerId) => {
      const targetPartner = partners.find((p) => p.id === partnerId);
      const partnerName = targetPartner?.businessName || targetPartner?.name || partnerId;

      try {
        const partnerRef = doc(db, "partners", partnerId);

        await updateDoc(partnerRef, {
          verificationStatus: "under_review",
          accountStatus: "Under Review",
          reviewedAt: serverTimestamp(),
          reviewedBy: currentUser?.uid || "super_admin",
          reviewerEmail: currentUser?.email || "admin@thesalontimes.com",
          updatedAt: serverTimestamp(),
        });

        addLog(
          "PARTNER_UNDER_REVIEW",
          partnerName,
          "Partner",
          `Application status set to Under Review.`,
          "Success"
        );
        addToast(`Application for ${partnerName} marked as Under Review.`, "info");
      } catch (err) {
        console.error("Error updating status to under_review:", err);
        addToast(`Failed: ${err.message}`, "error");
        throw err;
      }
    },
    [partners, currentUser, addLog, addToast]
  );

  // 4. Suspend Partner Account
  const suspendPartner = useCallback(
    async (partnerId, reason = "Administrative review") => {
      const targetPartner = partners.find((p) => p.id === partnerId);
      const partnerName = targetPartner?.businessName || targetPartner?.name || partnerId;

      try {
        const partnerRef = doc(db, "partners", partnerId);
        await updateDoc(partnerRef, {
          accountStatus: "Suspended",
          updatedAt: serverTimestamp(),
        });

        addLog(
          "PARTNER_SUSPENDED",
          partnerName,
          "Partner",
          `Account suspended: ${reason}`,
          "Warning"
        );
        addToast(`Account for ${partnerName} suspended.`, "warning");
      } catch (err) {
        console.error("Error suspending partner:", err);
        addToast(`Action failed: ${err.message}`, "error");
      }
    },
    [partners, addLog, addToast]
  );

  // 5. Reactivate Partner Account
  const reactivatePartner = useCallback(
    async (partnerId) => {
      const targetPartner = partners.find((p) => p.id === partnerId);
      const partnerName = targetPartner?.businessName || targetPartner?.name || partnerId;

      try {
        const partnerRef = doc(db, "partners", partnerId);
        await updateDoc(partnerRef, {
          accountStatus: "Active",
          updatedAt: serverTimestamp(),
        });

        addLog(
          "PARTNER_REACTIVATED",
          partnerName,
          "Partner",
          `Account reactivated to Active state.`,
          "Success"
        );
        addToast(`Account for ${partnerName} reactivated.`, "success");
      } catch (err) {
        console.error("Error reactivating partner:", err);
        addToast(`Action failed: ${err.message}`, "error");
      }
    },
    [partners, addLog, addToast]
  );

  // 6. Update single document status (Approve / Reject / Resubmit Request)
  const updateDocumentStatus = useCallback(
    async (partnerId, docId, status, reviewNotes) => {
      const targetPartner = partners.find((p) => p.id === partnerId);
      if (!targetPartner) return;

      try {
        const partnerRef = doc(db, "partners", partnerId);
        const currentDocs = targetPartner.documents || [];
        const updatedDocs = currentDocs.map((d) => {
          if (d.id === docId) {
            return {
              id: d.id,
              documentType: d.documentType || d.type,
              fileName: d.fileName || d.name,
              documentNumber: d.documentNumber || "",
              fileUrl: d.fileUrl || d.url || "",
              fileSize: d.fileSize || null,
              uploadDate: d.uploadDate ? new Date(d.uploadDate) : new Date(),
              status: status.toLowerCase(),
              reviewNotes: reviewNotes || d.reviewNotes || "",
            };
          }
          return {
            id: d.id,
            documentType: d.documentType || d.type,
            fileName: d.fileName || d.name,
            documentNumber: d.documentNumber || "",
            fileUrl: d.fileUrl || d.url || "",
            fileSize: d.fileSize || null,
            uploadDate: d.uploadDate ? new Date(d.uploadDate) : new Date(),
            status: d.status.toLowerCase(),
            reviewNotes: d.reviewNotes || "",
          };
        });

        await updateDoc(partnerRef, {
          documents: updatedDocs,
          updatedAt: serverTimestamp(),
        });

        addLog(
          `DOC_${status.toUpperCase()}`,
          `${partnerId} (${docId})`,
          "Document",
          `Document status updated to ${status}. Notes: ${reviewNotes || "None"}`,
          status === "Rejected" ? "Warning" : "Success"
        );
        addToast(
          `Document marked as ${status}.`,
          status === "Rejected" ? "warning" : "success"
        );
      } catch (err) {
        console.error("Error updating document status in Firestore:", err);
        addToast(`Failed: ${err.message}`, "error");
      }
    },
    [partners, addLog, addToast]
  );

  const requestResubmission = useCallback(
    (partnerId, docId, note) => {
      updateDocumentStatus(partnerId, docId, "Resubmission Requested", note);
    },
    [updateDocumentStatus]
  );

  // 7. Feature Permissions actions
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

  const savePartnerPermissions = useCallback(
    async (partnerId, updatedFeatures) => {
      const targetPartner = partners.find((p) => p.id === partnerId);
      const partnerName = targetPartner?.businessName || targetPartner?.name || partnerId;

      try {
        const partnerRef = doc(db, "partners", partnerId);
        await updateDoc(partnerRef, {
          enabledFeatures: updatedFeatures,
          updatedAt: serverTimestamp(),
        });

        addLog(
          "PERMISSIONS_UPDATED",
          partnerName,
          "Feature Permissions",
          `Permissions updated for ${partnerName}. Changes saved to database.`,
          "Success"
        );
        addToast(`Feature permissions updated for ${partnerName}.`, "success");
      } catch (err) {
        console.error("Error updating permissions:", err);
        addToast(`Failed to save permissions: ${err.message}`, "error");
      }
    },
    [partners, addLog, addToast]
  );

  // 8. Create Sample Partner Application in Firestore (For Testing when database is empty)
  const createSamplePartnerApplication = useCallback(async () => {
    try {
      const sampleId = `sample-partner-${Date.now().toString().slice(-6)}`;
      const partnerRef = doc(db, "partners", sampleId);
      const sampleData = {
        uid: sampleId,
        fullName: "Vikramaditya Rathore",
        phoneNumber: "+91 98390 12345",
        email: "vikram.salon@gmail.com",
        businessName: "Luxe Heritage Unisex Salon",
        role: "partner",
        legalName: "Rathore Grooming & Wellness LLP",
        businessType: "Limited Liability Partnership (LLP)",
        regNumber: "GSTIN-09AAACH7409R1ZZ",
        businessAddress: "Shop 14, Ground Floor, Z Square Mall, MG Road, Kanpur, UP 208001",
        verificationStatus: "submitted",
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        documents: [
          {
            id: `doc-${Date.now()}-1`,
            documentType: "Business Registration / Trade License",
            fileName: "trade_license_kanpur_corp.pdf",
            documentNumber: "LIC-KN-2026-9041",
            fileUrl: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=1200&auto=format&fit=crop&q=80",
            fileSize: 1450000,
            uploadDate: new Date(),
            status: "submitted",
          },
          {
            id: `doc-${Date.now()}-2`,
            documentType: "GST Registration Certificate",
            fileName: "gst_certificate_form_reg06.pdf",
            documentNumber: "09AAACH7409R1ZZ",
            fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80",
            fileSize: 820000,
            uploadDate: new Date(),
            status: "submitted",
          },
          {
            id: `doc-${Date.now()}-3`,
            documentType: "Government Identity Proof (Aadhaar/PAN)",
            fileName: "vikram_aadhaar_card.pdf",
            documentNumber: "XXXX-XXXX-8921",
            fileUrl: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=1200&auto=format&fit=crop&q=80",
            fileSize: 630000,
            uploadDate: new Date(),
            status: "submitted",
          },
        ],
      };
      await setDoc(partnerRef, sampleData);
      addToast("Created sample partner application in Cloud Firestore.", "success");
    } catch (err) {
      console.error("Error creating sample partner:", err);
      addToast("Failed to create sample application: " + err.message, "error");
    }
  }, [addToast]);

  // Salon actions
  const toggleSalonStatus = useCallback(
    (salonId) => {
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
    },
    [salons, addToast]
  );

  // Service actions
  const toggleServiceStatus = useCallback(
    (serviceId) => {
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
      addToast(
        `Service "${srv?.name || serviceId}" status updated to ${newStatus}.`,
        "info"
      );
    },
    [services, addToast]
  );

  // Booking actions
  const updateBookingStatus = useCallback(
    (bookingId, newStatus) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      addToast(`Booking ${bookingId} marked as ${newStatus}.`, "success");
      addLog(
        "BOOKING_STATUS_CHANGED",
        bookingId,
        "Booking",
        `Status set to ${newStatus}`,
        "Success"
      );
    },
    [addToast, addLog]
  );

  // Customer actions
  const toggleCustomerStatus = useCallback(
    (customerId) => {
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
    },
    [customers, addToast]
  );

  // Notifications
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast("All notifications marked as read.", "info");
  }, [addToast]);

  // Settings
  const updateSettings = useCallback(
    (newSettings) => {
      setPlatformSettings((prev) => ({ ...prev, ...newSettings }));
      addToast("Platform settings saved successfully.", "success");
      addLog(
        "SETTINGS_UPDATED",
        "Platform Settings",
        "Configuration",
        "Updated platform settings",
        "Success"
      );
    },
    [addToast, addLog]
  );

  const isSuperAdmin = Boolean(
    currentUser &&
      currentAdmin &&
      (currentAdmin.role === "Super Administrator" || currentAdmin.actualRole === "super_admin")
  );

  const value = {
    // Auth & Role
    currentUser,
    currentAdmin,
    authLoading,
    isSuperAdmin,
    isSetupComplete,
    checkSetupStatus,
    logout,
    updateAdminProfile,
    setCurrentAdmin,

    // Real Firestore Partners
    partners,
    partnersLoading,
    partnersError,
    approvePartner,
    rejectPartner,
    setPendingReview,
    suspendPartner,
    reactivatePartner,
    updateDocumentStatus,
    requestResubmission,
    togglePartnerPermission,
    savePartnerPermissions,
    createSamplePartnerApplication,

    // Other Platform State & Handlers
    salons,
    branches,
    bookings,
    services,
    customers,
    logs,
    toasts,
    notifications,
    platformSettings,
    addToast,
    removeToast,
    toggleSalonStatus,
    toggleServiceStatus,
    updateBookingStatus,
    toggleCustomerStatus,
    markAllNotificationsRead,
    updateSettings,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

const DEFAULT_ADMIN_CONTEXT = {
  currentUser: null,
  currentAdmin: {
    uid: "admin-default",
    name: "Super Administrator",
    email: "admin@thesalontimes.com",
    role: "Super Administrator",
    department: "Executive Platform Administration",
    status: "active",
  },
  authLoading: false,
  isSuperAdmin: true,
  isSetupComplete: true,
  checkSetupStatus: async () => true,
  logout: async () => {},
  updateAdminProfile: async () => {},
  setCurrentAdmin: () => {},
  partners: [],
  partnersLoading: false,
  partnersError: null,
  approvePartner: async () => {},
  rejectPartner: async () => {},
  setPendingReview: async () => {},
  suspendPartner: async () => {},
  reactivatePartner: async () => {},
  updateDocumentStatus: async () => {},
  requestResubmission: async () => {},
  togglePartnerPermission: () => {},
  savePartnerPermissions: async () => {},
  createSamplePartnerApplication: async () => {},
  salons: [],
  branches: [],
  bookings: [],
  services: [],
  customers: [],
  logs: [],
  toasts: [],
  notifications: [],
  platformSettings: {
    platformName: "The Salon Times",
    supportEmail: "admin-desk@thesalontimes.com",
    commissionRate: 12,
  },
  addToast: () => {},
  removeToast: () => {},
  toggleSalonStatus: () => {},
  toggleServiceStatus: () => {},
  updateBookingStatus: () => {},
  toggleCustomerStatus: () => {},
  markAllNotificationsRead: () => {},
  updateSettings: () => {},
};

export function useAdmin() {
  const context = useContext(AdminContext);
  return context || DEFAULT_ADMIN_CONTEXT;
}
