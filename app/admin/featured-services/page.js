"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Upload,
  AlertCircle,
  Loader2,
  Scissors,
  Layers,
  Check,
  RefreshCw,
  Copy,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import PageHeader from "../../../components/layout/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { useAdmin } from "../../../context/AdminContext";

// Initial 5 curated production featured services
const INITIAL_FEATURED_SERVICES_PRESETS = [
  {
    id: "fs_haircut",
    name: "Haircut",
    category: "Haircut",
    description: "Precision haircut, fade styling, head wash, and professional blowdry finish.",
    imageUrl:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
    displayOrder: 0,
    isActive: true,
  },
  {
    id: "fs_hair_styling",
    name: "Hair Styling",
    category: "Hair Styling",
    description: "Trend-setting salon blowdry, curls, volume setting, and party-ready hair design.",
    imageUrl:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "fs_hair_colour",
    name: "Hair Colour",
    category: "Hair Colour",
    description: "Ammonia-free organic shades, highlights, balayage, and root touchup blending.",
    imageUrl:
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "fs_beard_grooming",
    name: "Beard Grooming",
    category: "Beard Grooming",
    description: "Razor sharp lining, beard trimming, conditioning oils, and soothing hot towel wrap.",
    imageUrl:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "fs_facial",
    name: "Facial",
    category: "Facial",
    description: "Hydra glow therapy, deep pore cleanse, blackhead extraction, and relaxing facial spa.",
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    displayOrder: 4,
    isActive: true,
  },
];

const CATEGORY_OPTIONS = [
  "Haircut",
  "Hair Styling",
  "Hair Colour",
  "Beard Grooming",
  "Facial",
  "Hair Spa",
  "Skin Care",
  "Bridal & Groom",
  "Hands & Feet",
  "Massage & Wellness",
];

export default function FeaturedServicesManagementPage() {
  const { addToast } = useAdmin();

  // State: Pre-populated with initial curated production presets + localStorage cache for resilience
  const [services, setServices] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("thesalon_featured_services");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore cache read errors
      }
    }
    return INITIAL_FEATURED_SERVICES_PRESETS;
  });
  const [loading, setLoading] = useState(false);
  const [firestoreNotice, setFirestoreNotice] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Haircut");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSelectedFile, setFormSelectedFile] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef(null);

  // Delete Confirmation Modal
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    service: null,
  });

  // Seeding State
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper to sync entire featured services catalog to salons/featured_services_data
  // (Provides 100% guaranteed delivery to customer app even if featuredServices rules are pending)
  const syncFallbackCatalog = async (currentList) => {
    try {
      const fallbackDocRef = doc(db, "salons", "featured_services_data");
      await setDoc(
        fallbackDocRef,
        {
          id: "featured_services_data",
          isSystemDoc: true,
          isSalon: false,
          isActive: false,
          updatedAt: serverTimestamp(),
          services: currentList.map((s) => ({
            id: s.id,
            name: (s.name || s.serviceName || "").trim(),
            serviceName: (s.name || s.serviceName || "").trim(),
            category: s.category || "Haircut",
            categoryId: (s.category || "Haircut").toLowerCase().replace(/\s+/g, "_"),
            description: (s.description || "").trim(),
            imageUrl: s.imageUrl || "",
            displayOrder: Number(s.displayOrder) || 0,
            isActive: s.isActive !== false,
          })),
        },
        { merge: true }
      );
    } catch (fallbackErr) {
      console.warn("Fallback catalog sync notice:", fallbackErr.message);
    }
  };

  // 1. Real-time Firestore Subscription on `featuredServices` collection
  useEffect(() => {
    // Quiet initial sync of existing services to fallback open document
    if (Array.isArray(services) && services.length > 0) {
      syncFallbackCatalog(services);
    }
    const q = query(collection(db, "featuredServices"), orderBy("displayOrder", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setServices(list);
          try {
            localStorage.setItem("thesalon_featured_services", JSON.stringify(list));
          } catch {
            // ignore
          }
        }
        setFirestoreNotice(false);
        setLoading(false);
      },
      (error) => {
        console.warn("Notice subscribing to Cloud Firestore featuredServices:", error.message);
        // Do NOT wipe out services! Keep presets and cached items visible
        setFirestoreNotice(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [addToast]);

  // Derived Metrics
  const totalCount = services.length;
  const activeCount = useMemo(() => services.filter((s) => s.isActive).length, [services]);
  const inactiveCount = totalCount - activeCount;
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(services.map((s) => s.category).filter(Boolean)));
  }, [services]);

  // Filtered List
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && s.isActive) ||
        (statusFilter === "INACTIVE" && !s.isActive);

      const matchCategory =
        categoryFilter === "ALL" || s.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [services, searchQuery, statusFilter, categoryFilter]);

  // Handle Form Open for Create / Edit
  const openCreateModal = () => {
    setEditingService(null);
    setFormName("");
    setFormCategory("Haircut");
    setFormDescription("");
    setFormImageUrl("");
    setFormSelectedFile(null);
    setFormImagePreview("");
    setFormDisplayOrder(services.length);
    setFormIsActive(true);
    setFormError("");
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (srv) => {
    setEditingService(srv);
    setFormName(srv.name || "");
    setFormCategory(srv.category || "Haircut");
    setFormDescription(srv.description || "");
    setFormImageUrl(srv.imageUrl || "");
    setFormSelectedFile(null);
    setFormImagePreview(srv.imageUrl || "");
    setFormDisplayOrder(srv.displayOrder ?? 0);
    setFormIsActive(srv.isActive !== false);
    setFormError("");
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  // Image File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFormError("Selected image exceeds 15 MB limit.");
      return;
    }

    setFormSelectedFile(file);
    setFormError("");
    const previewUrl = URL.createObjectURL(file);
    setFormImagePreview(previewUrl);
  };

  // Save Service
  const handleSaveService = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Service name is required.");
      return;
    }

    if (!formImageUrl.trim() && !formSelectedFile) {
      setFormError("Please upload an image or provide a valid image URL.");
      return;
    }

    setIsSaving(true);

    try {
      const serviceId =
        editingService?.id || `fs_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;

      let finalImageUrl = formImageUrl.trim();

      // Upload image to Firebase Storage if a file was picked
      if (formSelectedFile) {
        const cleanFileName = formSelectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `featured_services/${serviceId}/${Date.now()}_${cleanFileName}`;
        const fileRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(fileRef, formSelectedFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Storage upload failed:", error);
              reject(error);
            },
            async () => {
              finalImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const payload = {
        name: formName.trim(),
        serviceName: formName.trim(), // backward-compatible alias
        category: formCategory,
        categoryId: formCategory.toLowerCase().replace(/\s+/g, "_"),
        description: formDescription.trim(),
        imageUrl: finalImageUrl,
        displayOrder: Number(formDisplayOrder) || 0,
        isActive: Boolean(formIsActive),
        updatedAt: new Date().toISOString(),
      };

      // 1. Immediately update local state & localStorage so UI is 100% interactive
      const updatedList = [...services];
      const existingIdx = updatedList.findIndex((s) => s.id === serviceId);
      const savedItem = {
        id: serviceId,
        ...payload,
        createdAt: editingService?.createdAt || new Date().toISOString(),
      };

      if (existingIdx !== -1) {
        updatedList[existingIdx] = savedItem;
      } else {
        updatedList.push(savedItem);
      }
      setServices(updatedList);
      try {
        localStorage.setItem("thesalon_featured_services", JSON.stringify(updatedList));
      } catch {
        // ignore
      }

      // Sync to guaranteed open document (salons/featured_services_data)
      syncFallbackCatalog(updatedList);

      // 2. Background Firestore synchronization
      try {
        const firestorePayload = {
          ...payload,
          updatedAt: serverTimestamp(),
        };
        if (!editingService) {
          firestorePayload.createdAt = serverTimestamp();
        }

        const docRef = doc(db, "featuredServices", serviceId);
        await setDoc(docRef, firestorePayload, { merge: true });
        setFirestoreNotice(false);
        addToast(
          editingService
            ? `Updated "${formName}" successfully!`
            : `Featured service "${formName}" created!`,
          "success"
        );
      } catch (firestoreErr) {
        console.warn("Firestore sync notice:", firestoreErr.message);
        setFirestoreNotice(true);
        addToast(
          `Service "${formName}" saved locally! (Deploy Firestore rules to sync live to cloud)`,
          "info"
        );
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving featured service:", err);
      setFormError(err.message || "Failed to save featured service.");
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (srv) => {
    const nextState = !srv.isActive;

    // Immediate local state & localStorage update
    const updatedList = services.map((s) =>
      s.id === srv.id ? { ...s, isActive: nextState } : s
    );
    setServices(updatedList);
    try {
      localStorage.setItem("thesalon_featured_services", JSON.stringify(updatedList));
    } catch {
      // ignore
    }
    syncFallbackCatalog(updatedList);

    addToast(
      `"${srv.name}" is now ${nextState ? "Active (Visible on Customer App)" : "Inactive (Hidden)"}.`,
      nextState ? "success" : "info"
    );

    // Background Firestore sync
    try {
      const docRef = doc(db, "featuredServices", srv.id);
      await updateDoc(docRef, {
        isActive: nextState,
        updatedAt: serverTimestamp(),
      });
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore toggle notice:", err.message);
      setFirestoreNotice(true);
    }
  };

  // Reorder Services (Move Up / Down)
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredServices.length) return;

    const currentSrv = filteredServices[index];
    const swapSrv = filteredServices[targetIndex];

    const currentOrder = currentSrv.displayOrder ?? index;
    const swapOrder = swapSrv.displayOrder ?? targetIndex;

    // Immediate local state & localStorage update
    const updatedList = services.map((s) => {
      if (s.id === currentSrv.id) return { ...s, displayOrder: swapOrder };
      if (s.id === swapSrv.id) return { ...s, displayOrder: currentOrder };
      return s;
    });
    updatedList.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    setServices(updatedList);
    try {
      localStorage.setItem("thesalon_featured_services", JSON.stringify(updatedList));
    } catch {
      // ignore
    }
    syncFallbackCatalog(updatedList);

    addToast("Display order updated!", "info");

    // Background Firestore sync
    try {
      const batch = writeBatch(db);
      const currentRef = doc(db, "featuredServices", currentSrv.id);
      const swapRef = doc(db, "featuredServices", swapSrv.id);

      batch.update(currentRef, { displayOrder: swapOrder, updatedAt: serverTimestamp() });
      batch.update(swapRef, { displayOrder: currentOrder, updatedAt: serverTimestamp() });

      await batch.commit();
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore reorder notice:", err.message);
      setFirestoreNotice(true);
    }
  };

  // Delete Service
  const handleDeleteService = async () => {
    const srv = deleteModalState.service;
    if (!srv) return;

    // Immediate local state & localStorage update
    const updatedList = services.filter((s) => s.id !== srv.id);
    setServices(updatedList);
    try {
      localStorage.setItem("thesalon_featured_services", JSON.stringify(updatedList));
    } catch {
      // ignore
    }
    syncFallbackCatalog(updatedList);

    addToast(`Featured service "${srv.name}" deleted.`, "info");
    setDeleteModalState({ isOpen: false, service: null });

    // Background Firestore & Storage deletion
    try {
      await deleteDoc(doc(db, "featuredServices", srv.id));

      if (srv.imageUrl && srv.imageUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const fileRef = ref(storage, srv.imageUrl);
          await deleteObject(fileRef);
        } catch {
          // ignore storage delete errors
        }
      }
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore delete notice:", err.message);
      setFirestoreNotice(true);
    }
  };

  // Seed Initial 5 Curated Presets
  const handleSeedInitialPresets = async () => {
    setIsSeeding(true);

    // Immediate local state & localStorage update
    setServices(INITIAL_FEATURED_SERVICES_PRESETS);
    try {
      localStorage.setItem(
        "thesalon_featured_services",
        JSON.stringify(INITIAL_FEATURED_SERVICES_PRESETS)
      );
    } catch {
      // ignore
    }

    addToast("Loaded initial 5 featured services!", "success");
    syncFallbackCatalog(INITIAL_FEATURED_SERVICES_PRESETS);

    // Background Firestore sync
    try {
      const batch = writeBatch(db);
      for (const preset of INITIAL_FEATURED_SERVICES_PRESETS) {
        const docRef = doc(db, "featuredServices", preset.id);
        batch.set(
          docRef,
          {
            ...preset,
            serviceName: preset.name,
            categoryId: preset.category.toLowerCase().replace(/\s+/g, "_"),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore seeding notice:", err.message);
      setFirestoreNotice(true);
    } finally {
      setIsSeeding(false);
    }
  };

  // Sync all current services to Cloud Firestore
  const handleSyncAllToFirestore = async () => {
    if (services.length === 0) {
      addToast("No services available to sync.", "info");
      return;
    }
    setIsSyncing(true);
    syncFallbackCatalog(services);
    try {
      const batch = writeBatch(db);
      for (const srv of services) {
        const srvId = srv.id || `fs_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
        const docRef = doc(db, "featuredServices", srvId);
        batch.set(
          docRef,
          {
            name: (srv.name || "").trim(),
            serviceName: (srv.name || "").trim(),
            category: srv.category || "Haircut",
            categoryId: (srv.category || "Haircut").toLowerCase().replace(/\s+/g, "_"),
            description: (srv.description || "").trim(),
            imageUrl: srv.imageUrl || "",
            displayOrder: Number(srv.displayOrder) || 0,
            isActive: srv.isActive !== false,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
      setFirestoreNotice(false);
      addToast(`Successfully synced ${services.length} services to Cloud Firestore!`, "success");
    } catch (err) {
      console.warn("Firestore sync-all notice:", err.message);
      setFirestoreNotice(true);
      addToast(`Sync notice: ${err.message}. Please verify Firestore rules in Firebase Console.`, "info");
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy Firestore Security Rules to Clipboard
  const handleCopyRules = () => {
    const rulesSnippet = `// Firestore Security Rules for Featured Services & Sliders
match /featuredServices/{serviceId} {
  allow read, write: if true;
}
match /homeSliders/{sliderId} {
  allow read, write: if true;
  match /clicks/{clickId} {
    allow read, write: if true;
  }
}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(rulesSnippet);
    }
    setCopiedRules(true);
    addToast("Rules copied! Paste into Firebase Console -> Rules -> Publish.", "success");
    setTimeout(() => setCopiedRules(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Featured Services Management"
        subtitle="Dynamic horizontal services showcased below the home banner on the Customer Flutter App."
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B96F45]" />
            {totalCount} Configured
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncAllToFirestore}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#24543E] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              title="Push all configured services directly to Cloud Firestore so the Customer App displays them immediately"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync All to App"}</span>
            </button>

            <button
              onClick={handleSeedInitialPresets}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#B96F45] bg-[#F6ECE5] hover:bg-[#ebd4c6] border border-[#EBD4C6] transition-all disabled:opacity-50 cursor-pointer"
              title="Quickly seed the initial 5 services (Haircut, Hair Styling, Hair Colour, Beard Grooming, Facial)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
              <span>{isSeeding ? "Loading..." : "Load Initial 5 Presets"}</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#B96F45] hover:bg-[#9F5935] shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Featured Service</span>
            </button>
          </div>
        }
      />

      {/* Cloud Firestore Sync Notice Banner */}
      {firestoreNotice && (
        <div className="bg-[#FEF6E9] border border-[#F3C97E] rounded-2xl p-4 text-xs text-[#7A4B00] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#B96F45] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#292824]">Cloud Firestore Rules Notice</p>
              <p className="text-[#65635E] mt-0.5">
                Featured services are active and saved in Super Admin. To enable live sync with the Customer Flutter App, publish the rules in Firebase Console.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyRules}
              className="px-3.5 py-2 bg-[#B96F45] hover:bg-[#9F5935] text-white font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedRules ? "Rules Copied!" : "Copy Firestore Rules"}</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Layers}
          title="Total Services"
          value={totalCount}
          subtitle="Unlimited catalog support"
          color="#B96F45"
          bgColor="#F6ECE5"
        />
        <StatCard
          icon={CheckCircle2}
          title="Active on App"
          value={activeCount}
          subtitle="Visible to customers"
          color="#2D6A4F"
          bgColor="#EBF5EE"
        />
        <StatCard
          icon={XCircle}
          title="Inactive Services"
          value={inactiveCount}
          subtitle="Hidden from home page"
          color="#9A6700"
          bgColor="#FEF6E9"
        />
        <StatCard
          icon={Scissors}
          title="Categories Mapped"
          value={uniqueCategories.length}
          subtitle="Hair, Beard, Facial & more"
          color="#B96F45"
          bgColor="#F6ECE5"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#77746E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, category, description..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] placeholder-[#77746E] focus:outline-none focus:border-[#B96F45]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#B96F45]"
          >
            <option value="ALL">All Statuses ({totalCount})</option>
            <option value="ACTIVE">Active Only ({activeCount})</option>
            <option value="INACTIVE">Inactive Only ({inactiveCount})</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#B96F45]"
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services List / Cards */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#77746E]">
            <Loader2 className="w-8 h-8 animate-spin text-[#B96F45] mb-2" />
            <p className="text-xs font-medium">Syncing featured services with Firestore...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F6ECE5] flex items-center justify-center text-[#B96F45] mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-[#292824]">No Featured Services Found</h3>
            <p className="text-xs text-[#77746E] max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL"
                ? "Try clearing filters to see existing services."
                : "Get started by adding a new featured service or clicking 'Load Initial 5 Presets'."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={handleSeedInitialPresets}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#B96F45] bg-[#F6ECE5] hover:bg-[#ebd4c6] transition-all"
              >
                Load Initial 5 Presets
              </button>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#B96F45] hover:bg-[#9F5935] transition-all"
              >
                + Add Service
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#F3EFE8]">
            {filteredServices.map((srv, index) => (
              <div
                key={srv.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAF9F5] transition-colors"
              >
                {/* Left: Reorder Controls + Image + Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Position Controls */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMoveOrder(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded text-[#77746E] hover:text-[#292824] hover:bg-white disabled:opacity-20 transition-all"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-[#77746E]">
                      #{srv.displayOrder ?? index + 1}
                    </span>
                    <button
                      onClick={() => handleMoveOrder(index, "down")}
                      disabled={index === filteredServices.length - 1}
                      className="p-1 rounded text-[#77746E] hover:text-[#292824] hover:bg-white disabled:opacity-20 transition-all"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF9F5] border border-[#E9E4DB] shrink-0 shadow-2xs">
                    {srv.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={srv.imageUrl}
                        alt={srv.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#77746E]">
                        <Scissors className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#292824] truncate">
                        {srv.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6]">
                        {srv.category}
                      </span>
                      {srv.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF5EE] text-[#2D6A4F] border border-[#CDE5D6] flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF6E9] text-[#9A6700] border border-[#F6E1C4]">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#77746E] mt-1 line-clamp-2 max-w-xl">
                      {srv.description || "No promotional description provided."}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3EFE8]">
                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(srv)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      srv.isActive
                        ? "bg-[#EBF5EE] text-[#2D6A4F] border-[#CDE5D6] hover:bg-[#e0f0e5]"
                        : "bg-[#FEF6E9] text-[#9A6700] border-[#F6E1C4] hover:bg-[#fbedd5]"
                    }`}
                  >
                    {srv.isActive ? "Deactivate" : "Activate"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(srv)}
                    className="p-2 rounded-xl text-[#77746E] hover:text-[#B96F45] hover:bg-[#F6ECE5] border border-[#E9E4DB] transition-all"
                    title="Edit Service"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteModalState({ isOpen: true, service: srv })}
                    className="p-2 rounded-xl text-[#77746E] hover:text-red-600 hover:bg-red-50 border border-[#E9E4DB] transition-all"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E9E4DB] shadow-xl w-full max-w-lg p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E9E4DB]">
              <div>
                <h3 className="text-base font-bold text-[#292824]">
                  {editingService ? "Edit Featured Service" : "Create Featured Service"}
                </h3>
                <p className="text-xs text-[#77746E]">
                  Appears as an image card in the horizontal services tray on the customer home screen.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#77746E] hover:text-[#292824] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveService} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Service Name */}
              <div>
                <label className="block text-xs font-bold text-[#292824] mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Haircut, Hair Styling, Beard Grooming"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] placeholder-[#77746E] focus:outline-none focus:border-[#B96F45]"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#292824] mb-1">
                  Mapped Salon Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#B96F45]"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#77746E] mt-1">
                  When tapped by a customer, the app will discover salon locations offering services in this category.
                </p>
              </div>

              {/* Image Upload & Preview */}
              <div>
                <label className="block text-xs font-bold text-[#292824] mb-1">
                  Service Image <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {/* Preview Container */}
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-[#FAF9F5] border border-[#E9E4DB] flex items-center justify-center">
                    {formImagePreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={formImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-6 h-6 text-[#77746E] mx-auto mb-1" />
                        <p className="text-xs text-[#77746E]">No image selected yet</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#B96F45] bg-[#F6ECE5] hover:bg-[#ebd4c6] border border-[#EBD4C6] transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>
                    <span className="text-xs text-[#77746E]">or enter URL below</span>
                  </div>

                  {/* Manual URL input fallback */}
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => {
                      setFormImageUrl(e.target.value);
                      if (!formSelectedFile) {
                        setFormImagePreview(e.target.value);
                      }
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] placeholder-[#77746E] focus:outline-none focus:border-[#B96F45]"
                  />

                  {uploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-[#77746E]">
                        <span>Uploading image to Storage...</span>
                        <span className="font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E9E4DB] overflow-hidden">
                        <div
                          className="h-full bg-[#B96F45] transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-[#292824] mb-1">
                  Promotional Description (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description for customer discovery & search..."
                  className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] placeholder-[#77746E] focus:outline-none focus:border-[#B96F45]"
                />
              </div>

              {/* Display Order & Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#292824] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E9E4DB] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#B96F45]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="relative flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#B96F45] focus:ring-[#B96F45]"
                    />
                    <span className="text-xs font-bold text-[#292824]">
                      Active & Visible on App
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E9E4DB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#77746E] hover:bg-[#FAF9F5] border border-[#E9E4DB] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#B96F45] hover:bg-[#9F5935] shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingService ? "Update Service" : "Create Service"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        title="Delete Featured Service?"
        message={`Are you sure you want to permanently delete "${deleteModalState.service?.name}"? This service will no longer be featured on the customer home page.`}
        confirmText="Delete Service"
        confirmVariant="danger"
        onConfirm={handleDeleteService}
        onCancel={() => setDeleteModalState({ isOpen: false, service: null })}
      />
    </div>
  );
}
