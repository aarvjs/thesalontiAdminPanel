"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  GalleryHorizontal,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  MapPin,
  Radio,
  MousePointerClick,
  CheckCircle2,
  XCircle,
  Upload,
  AlertCircle,
  Loader2,
  Sparkles,
  Clock,
  Layers,
  Store,
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
  getDocs,
  limit,
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
import { INITIAL_SALONS } from "../../../data/salons-data";

// Initial promotional presets (Curated high-res salon imagery)
const INITIAL_SLIDER_PRESETS = [
  {
    id: "slider_preset_kanpur_mall_road",
    title: "Flat 25% Off Luxury Grooming",
    subtitle: "Experience master styling and beard spa at Mall Road's premier salon.",
    buttonText: "Explore Salon",
    imageUrl:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
    salonId: "salon_kanpur_mall_road",
    salonName: "The Groom Room – Mall Road",
    salonAddress: "The Mall Road, Near Phool Bagh, Kanpur",
    city: "Kanpur",
    targetLatitude: 26.4719,
    targetLongitude: 80.3524,
    visibilityRadiusKm: 5.0,
    isGlobal: false,
    isActive: true,
    displayOrder: 0,
    clickCount: 142,
  },
  {
    id: "slider_preset_kanpur_swaroop_nagar",
    title: "Express Haircuts & Keratin Spa",
    subtitle: "Zero wait times for appointments at Swaroop Nagar.",
    buttonText: "Book Now",
    imageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    salonId: "salon_kanpur_swaroop_nagar",
    salonName: "Royalty Barber Lounge – Swaroop Nagar",
    salonAddress: "Swaroop Nagar Commercial Market, Kanpur",
    city: "Kanpur",
    targetLatitude: 26.4815,
    targetLongitude: 80.3168,
    visibilityRadiusKm: 4.0,
    isGlobal: false,
    isActive: true,
    displayOrder: 1,
    clickCount: 89,
  },
  {
    id: "slider_preset_lucknow_gomti_nagar",
    title: "Bridal & Aesthetic Skin Glow Clinic",
    subtitle: "Celebrity cosmetologists & bridal hair styling in Gomti Nagar.",
    buttonText: "View Salon",
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
    salonId: "salon_lucknow_gomti_nagar",
    salonName: "Glow & Petal Clinic – Gomti Nagar",
    salonAddress: "Vibhuti Khand, Gomti Nagar, Lucknow",
    city: "Lucknow",
    targetLatitude: 26.8587,
    targetLongitude: 80.9984,
    visibilityRadiusKm: 8.0,
    isGlobal: false,
    isActive: true,
    displayOrder: 2,
    clickCount: 64,
  },
];

export default function SlidersManagementPage() {
  const { addToast } = useAdmin();

  // State: Pre-populated with initial production presets + localStorage cache for resilience
  const [sliders, setSliders] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("thesalon_home_sliders");
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
    return INITIAL_SLIDER_PRESETS;
  });
  const [loadingSliders, setLoadingSliders] = useState(false);
  const [firestoreNotice, setFirestoreNotice] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [registeredSalons, setRegisteredSalons] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [salonFilter, setSalonFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Delete Confirmation Modal
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    slider: null,
  });

  // Click Analytics Details Modal
  const [analyticsModalState, setAnalyticsModalState] = useState({
    isOpen: false,
    slider: null,
    clicks: [],
    loading: false,
  });

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formButtonText, setFormButtonText] = useState("Explore Salon");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSelectedFile, setFormSelectedFile] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const [formSelectedSalonId, setFormSelectedSalonId] = useState("");
  const [formSalonName, setFormSalonName] = useState("");
  const [formSalonAddress, setFormSalonAddress] = useState("");
  const [formPartnerId, setFormPartnerId] = useState("");
  const [formTargetLat, setFormTargetLat] = useState("26.4719");
  const [formTargetLng, setFormTargetLng] = useState("80.3524");
  const [formVisibilityRadius, setFormVisibilityRadius] = useState("5.0");
  const [formIsGlobal, setFormIsGlobal] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef(null);

  // 2. Real-time Firestore Subscription on `homeSliders` collection
  useEffect(() => {
    const q = query(collection(db, "homeSliders"), orderBy("displayOrder", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setSliders(list);
          try {
            localStorage.setItem("thesalon_home_sliders", JSON.stringify(list));
          } catch {
            // ignore
          }
        }
        setFirestoreNotice(false);
        setLoadingSliders(false);
      },
      (error) => {
        console.warn("Notice subscribing to Cloud Firestore homeSliders:", error.message);
        // Do NOT wipe out sliders! Keep showing presets/cached data
        setFirestoreNotice(true);
        setLoadingSliders(false);
      }
    );

    return () => unsubscribe();
  }, [addToast]);

  // 2. Fetch real salons from Firestore `salons` collection
  useEffect(() => {
    async function loadSalons() {
      try {
        const snap = await getDocs(collection(db, "salons"));
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || data.salonName || "Salon Location",
            address: data.address || `${data.city || "Kanpur"}`,
            city: data.city || "Kanpur",
            latitude: Number(data.latitude) || 26.4719,
            longitude: Number(data.longitude) || 80.3524,
            partnerId: data.partnerId || "",
            isActive: data.isActive !== false && data.salonStatus !== false,
          };
        });

        // Merge with initial registered salons so Super Admin always has target options
        if (list.length === 0) {
          const defaults = INITIAL_SALONS.map((s, idx) => ({
            id: s.id || `salon_demo_${idx}`,
            name: s.name,
            address: `${s.city || "Kanpur"}, Uttar Pradesh`,
            city: s.city || "Kanpur",
            latitude: idx === 0 ? 26.4719 : idx === 1 ? 26.4815 : 26.8587,
            longitude: idx === 0 ? 80.3524 : idx === 1 ? 80.3168 : 80.9984,
            partnerId: s.partnerId || `partner_${idx}`,
            isActive: s.status === "Active",
          }));
          setRegisteredSalons(defaults);
        } else {
          setRegisteredSalons(list);
        }
      } catch (err) {
        console.warn("Failed fetching salons from Firestore, using platform directory:", err);
        const defaults = INITIAL_SALONS.map((s, idx) => ({
          id: s.id || `salon_demo_${idx}`,
          name: s.name,
          address: `${s.city || "Kanpur"}, Uttar Pradesh`,
          city: s.city || "Kanpur",
          latitude: idx === 0 ? 26.4719 : idx === 1 ? 26.4815 : 26.8587,
          longitude: idx === 0 ? 80.3524 : idx === 1 ? 80.3168 : 80.9984,
          partnerId: s.partnerId || `partner_${idx}`,
          isActive: s.status === "Active",
        }));
        setRegisteredSalons(defaults);
      }
    }
    loadSalons();
  }, []);

  // Compute Stats
  const stats = useMemo(() => {
    const total = sliders.length;
    const active = sliders.filter((s) => s.isActive).length;
    const inactive = total - active;
    const totalClicks = sliders.reduce((acc, curr) => acc + (Number(curr.clickCount) || 0), 0);
    return { total, active, inactive, totalClicks };
  }, [sliders]);

  // Filtered Sliders List
  const filteredSliders = useMemo(() => {
    return sliders.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (s.salonName && s.salonName.toLowerCase().includes(q)) ||
        (s.salonAddress && s.salonAddress.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && s.isActive) ||
        (statusFilter === "INACTIVE" && !s.isActive);

      const matchSalon = salonFilter === "ALL" || s.salonId === salonFilter;

      return matchSearch && matchStatus && matchSalon;
    });
  }, [sliders, searchQuery, statusFilter, salonFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSlider(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormButtonText("Explore Salon");
    setFormImageUrl("");
    setFormSelectedFile(null);
    setFormImagePreview("");
    setFormIsGlobal(false);
    setFormIsActive(true);
    setFormDisplayOrder(sliders.length);
    setFormStartsAt("");
    setFormEndsAt("");
    setFormError("");

    // Default select first available salon
    if (registeredSalons.length > 0) {
      const first = registeredSalons[0];
      setFormSelectedSalonId(first.id);
      setFormSalonName(first.name);
      setFormSalonAddress(first.address);
      setFormPartnerId(first.partnerId);
      setFormTargetLat(String(first.latitude));
      setFormTargetLng(String(first.longitude));
      setFormVisibilityRadius("5.0");
    } else {
      setFormSelectedSalonId("");
      setFormSalonName("");
      setFormSalonAddress("");
      setFormPartnerId("");
      setFormTargetLat("26.4719");
      setFormTargetLng("80.3524");
      setFormVisibilityRadius("5.0");
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (slider) => {
    setEditingSlider(slider);
    setFormTitle(slider.title || "");
    setFormSubtitle(slider.subtitle || "");
    setFormButtonText(slider.buttonText || "Explore Salon");
    setFormImageUrl(slider.imageUrl || "");
    setFormSelectedFile(null);
    setFormImagePreview(slider.imageUrl || "");
    setFormSelectedSalonId(slider.salonId || "");
    setFormSalonName(slider.salonName || "");
    setFormSalonAddress(slider.salonAddress || "");
    setFormPartnerId(slider.partnerId || "");
    setFormTargetLat(String(slider.targetLatitude ?? 26.4719));
    setFormTargetLng(String(slider.targetLongitude ?? 80.3524));
    setFormVisibilityRadius(String(slider.visibilityRadiusKm ?? 5.0));
    setFormIsGlobal(Boolean(slider.isGlobal));
    setFormIsActive(slider.isActive !== false);
    setFormDisplayOrder(Number(slider.displayOrder) || 0);

    // Format dates for datetime-local
    const toIsoLocal = (val) => {
      if (!val) return "";
      try {
        const d = val.toDate ? val.toDate() : new Date(val);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } catch {
        return "";
      }
    };

    setFormStartsAt(toIsoLocal(slider.startsAt));
    setFormEndsAt(toIsoLocal(slider.endsAt));
    setFormError("");
    setIsModalOpen(true);
  };

  // When salon selection changes, automatically update target lat/lng & address
  const handleSalonChange = (salonId) => {
    setFormSelectedSalonId(salonId);
    const selected = registeredSalons.find((s) => s.id === salonId);
    if (selected) {
      setFormSalonName(selected.name);
      setFormSalonAddress(selected.address);
      setFormPartnerId(selected.partnerId || "");
      setFormTargetLat(String(selected.latitude));
      setFormTargetLng(String(selected.longitude));
    }
  };

  // Handle local image file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setFormError("Image file size exceeds 12 MB limit.");
      return;
    }

    setFormError("");
    setFormSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFormImagePreview(previewUrl);
  };

  // Quick Preset Picker
  const handleApplyPreset = (preset) => {
    setFormTitle(preset.title);
    setFormSubtitle(preset.subtitle);
    setFormButtonText(preset.buttonText);
    setFormImageUrl(preset.imageUrl);
    setFormImagePreview(preset.imageUrl);
    setFormSelectedFile(null);
    setFormTargetLat(String(preset.targetLatitude));
    setFormTargetLng(String(preset.targetLongitude));
    setFormVisibilityRadius(String(preset.visibilityRadiusKm));
    setFormIsGlobal(preset.isGlobal);

    // Try matching an existing salon or use preset name
    const match = registeredSalons.find(
      (s) =>
        s.name.toLowerCase().includes(preset.city.toLowerCase()) ||
        s.city.toLowerCase().includes(preset.city.toLowerCase())
    );
    if (match) {
      setFormSelectedSalonId(match.id);
      setFormSalonName(match.name);
      setFormSalonAddress(match.address);
      setFormPartnerId(match.partnerId || "");
    }
    addToast("Applied promotional slider template!", "info");
  };

  // Save / Update Slider
  const handleSaveSlider = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Slider title/headline is required.");
      return;
    }

    if (!formSubtitle.trim()) {
      setFormError("Promotional subtitle/description is required.");
      return;
    }

    if (!formSelectedSalonId && !formIsGlobal) {
      setFormError("Please select the target salon location.");
      return;
    }

    const lat = parseFloat(formTargetLat);
    const lng = parseFloat(formTargetLng);
    if (!formIsGlobal && (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180)) {
      setFormError("Please provide valid geographical coordinates (-90 to 90 lat, -180 to 180 lng).");
      return;
    }

    const radius = parseFloat(formVisibilityRadius);
    if (!formIsGlobal && (isNaN(radius) || radius <= 0)) {
      setFormError("Please enter a positive visibility radius in kilometres.");
      return;
    }

    if (!formSelectedFile && !formImageUrl && !formImagePreview) {
      setFormError("Please upload an image from your device or specify an image URL.");
      return;
    }

    setIsSaving(true);

    try {
      const sliderId = editingSlider?.id || `slider_${Date.now()}`;
      let finalImageUrl = formImageUrl;

      // Upload image to Firebase Storage if a new local file was selected
      if (formSelectedFile) {
        const fileExt = formSelectedFile.name.split(".").pop() || "jpg";
        const storagePath = `home_sliders/${sliderId}/banner_${Date.now()}.${fileExt}`;
        const storageReference = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageReference, formSelectedFile);

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

        // Cleanup previous image if it was hosted in Firebase Storage
        if (editingSlider?.imageUrl && editingSlider.imageUrl.includes("home_sliders")) {
          try {
            const oldRef = ref(storage, editingSlider.imageUrl);
            await deleteObject(oldRef);
          } catch {
            // ignore
          }
        }
      } else if (formImagePreview && !formImageUrl) {
        finalImageUrl = formImagePreview;
      }

      const payload = {
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        buttonText: formButtonText.trim() || "Explore Salon",
        imageUrl: finalImageUrl,
        salonId: formSelectedSalonId || "",
        salonName: formSalonName.trim() || "Salon Location",
        salonAddress: formSalonAddress.trim() || "",
        partnerId: formPartnerId || "",
        targetLatitude: isNaN(lat) ? 26.4719 : lat,
        targetLongitude: isNaN(lng) ? 80.3524 : lng,
        visibilityRadiusKm: isNaN(radius) ? 5.0 : radius,
        isGlobal: Boolean(formIsGlobal),
        isActive: Boolean(formIsActive),
        displayOrder: Number(formDisplayOrder) || 0,
        startsAt: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        endsAt: formEndsAt ? new Date(formEndsAt).toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      // 1. Immediately update local state & localStorage so admin UI is 100% responsive
      const updatedList = [...sliders];
      const existingIdx = updatedList.findIndex((s) => s.id === sliderId);
      const savedItem = {
        id: sliderId,
        ...payload,
        clickCount: editingSlider?.clickCount || 0,
        createdAt: editingSlider?.createdAt || new Date().toISOString(),
      };

      if (existingIdx !== -1) {
        updatedList[existingIdx] = savedItem;
      } else {
        updatedList.push(savedItem);
      }
      setSliders(updatedList);
      try {
        localStorage.setItem("thesalon_home_sliders", JSON.stringify(updatedList));
      } catch {
            // ignore
          }

      // 2. Synchronize to Cloud Firestore
      try {
        if (!editingSlider) {
          payload.clickCount = 0;
          payload.createdAt = serverTimestamp();
          await setDoc(doc(db, "homeSliders", sliderId), payload);
        } else {
          await updateDoc(doc(db, "homeSliders", sliderId), payload);
        }
        setFirestoreNotice(false);
        addToast(
          editingSlider ? "Slider details updated successfully!" : "New promotional slider published successfully!",
          "success"
        );
      } catch (firestoreErr) {
        console.warn("Firestore sync notice:", firestoreErr.message);
        setFirestoreNotice(true);
        addToast("Slider saved locally! (Deploy Firestore rules to sync live to cloud)", "info");
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving slider:", err);
      setFormError(`Failed to save slider: ${err.message}`);
      addToast(`Error saving slider: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  // Toggle Active / Inactive
  const handleToggleStatus = async (slider) => {
    const nextState = !slider.isActive;

    // Immediate local state & localStorage update
    const updatedList = sliders.map((s) =>
      s.id === slider.id ? { ...s, isActive: nextState } : s
    );
    setSliders(updatedList);
    try {
      localStorage.setItem("thesalon_home_sliders", JSON.stringify(updatedList));
    } catch {
            // ignore
          }

    addToast(
      `Slider "${slider.title}" is now ${nextState ? "Active (Live)" : "Disabled"}.`,
      nextState ? "success" : "info"
    );

    // Background Firestore sync
    try {
      await updateDoc(doc(db, "homeSliders", slider.id), {
        isActive: nextState,
        updatedAt: serverTimestamp(),
      });
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore toggle notice:", err.message);
      setFirestoreNotice(true);
    }
  };

  // Reorder Sliders (Move Up / Move Down)
  const handleReorder = async (slider, direction) => {
    const currentIndex = sliders.findIndex((s) => s.id === slider.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sliders.length) return;

    const targetSlider = sliders[targetIndex];
    const orderA = targetSlider.displayOrder ?? targetIndex;
    const orderB = slider.displayOrder ?? currentIndex;

    // Immediate local state update
    const updatedList = sliders.map((s) => {
      if (s.id === slider.id) return { ...s, displayOrder: orderA };
      if (s.id === targetSlider.id) return { ...s, displayOrder: orderB };
      return s;
    });
    updatedList.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    setSliders(updatedList);
    try {
      localStorage.setItem("thesalon_home_sliders", JSON.stringify(updatedList));
    } catch {
            // ignore
          }

    addToast("Slider display order updated.", "info");

    // Background Firestore sync
    try {
      await updateDoc(doc(db, "homeSliders", slider.id), {
        displayOrder: orderA,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "homeSliders", targetSlider.id), {
        displayOrder: orderB,
        updatedAt: serverTimestamp(),
      });
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore reorder notice:", err.message);
      setFirestoreNotice(true);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    const slider = deleteModalState.slider;
    if (!slider) return;

    // Immediate local state update
    const updatedList = sliders.filter((s) => s.id !== slider.id);
    setSliders(updatedList);
    try {
      localStorage.setItem("thesalon_home_sliders", JSON.stringify(updatedList));
    } catch {
            // ignore
          }

    addToast(`Slider "${slider.title}" deleted permanently.`, "info");
    setDeleteModalState({ isOpen: false, slider: null });

    // Background Firestore delete
    try {
      await deleteDoc(doc(db, "homeSliders", slider.id));
      if (slider.imageUrl && slider.imageUrl.includes("home_sliders")) {
        try {
          const fileRef = ref(storage, slider.imageUrl);
          await deleteObject(fileRef);
        } catch {
            // ignore
          }
      }
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore delete notice:", err.message);
      setFirestoreNotice(true);
    }
  };

  // Seed Initial 3 Sliders
  const handleSeedInitialSliders = async () => {
    setSliders(INITIAL_SLIDER_PRESETS);
    try {
      localStorage.setItem("thesalon_home_sliders", JSON.stringify(INITIAL_SLIDER_PRESETS));
    } catch {
            // ignore
          }

    addToast("Successfully seeded 3 dynamic home promotional sliders!", "success");

    // Attempt background Firestore sync
    try {
      for (let i = 0; i < INITIAL_SLIDER_PRESETS.length; i++) {
        const p = INITIAL_SLIDER_PRESETS[i];
        const id = p.id;
        const targetSalon =
          registeredSalons[i] ||
          registeredSalons[0] || {
            id: p.salonId || `salon_initial_${i + 1}`,
            name: p.salonName,
            address: p.salonAddress,
            partnerId: `partner_${i + 1}`,
          };

        await setDoc(doc(db, "homeSliders", id), {
          title: p.title,
          subtitle: p.subtitle,
          buttonText: p.buttonText,
          imageUrl: p.imageUrl,
          salonId: targetSalon.id,
          salonName: targetSalon.name,
          salonAddress: targetSalon.address,
          partnerId: targetSalon.partnerId || "",
          targetLatitude: p.targetLatitude,
          targetLongitude: p.targetLongitude,
          visibilityRadiusKm: p.visibilityRadiusKm,
          isGlobal: p.isGlobal,
          isActive: p.isActive,
          displayOrder: p.displayOrder,
          clickCount: p.clickCount || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setFirestoreNotice(false);
    } catch (err) {
      console.warn("Firestore seeding notice:", err.message);
      setFirestoreNotice(true);
    }
  };

  // Open Click Analytics Modal
  const handleOpenAnalytics = async (slider) => {
    setAnalyticsModalState({
      isOpen: true,
      slider,
      clicks: [],
      loading: true,
    });

    try {
      const clicksQuery = query(
        collection(db, "homeSliders", slider.id, "clicks"),
        orderBy("clickedAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(clicksQuery);
      const records = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setAnalyticsModalState((prev) => ({
        ...prev,
        clicks: records,
        loading: false,
      }));
    } catch (err) {
      console.warn("Notice reading clicks subcollection:", err);
      setAnalyticsModalState((prev) => ({
        ...prev,
        clicks: [],
        loading: false,
      }));
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
      <PageHeader
        title="Home Page Management → Sliders"
        subtitle="Manage dynamic promotional carousels, target salon location mapping, custom radius, and real-time customer app promotions."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6ECE5] text-[#B96F45] border border-[#EBD4C6]">
            {stats.active} / {stats.total} Active Sliders
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {sliders.length === 0 && (
              <button
                type="button"
                onClick={handleSeedInitialSliders}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E9E4DB] text-[#292824] hover:bg-[#F8F6F1] shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#B96F45]" />
                <span>Seed Initial 3 Sliders</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#B96F45] hover:bg-[#9F5935] text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Slider</span>
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
                Sliders are active and saved in Super Admin. To enable live sync with the Customer Flutter App, publish the rules in Firebase Console.
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sliders"
          value={stats.total}
          description="Total promotional slides configured"
          icon={Layers}
        />
        <StatCard
          title="Active (Live)"
          value={stats.active}
          description="Currently visible within radius"
          icon={CheckCircle2}
          trendType="positive"
        />
        <StatCard
          title="Inactive / Paused"
          value={stats.inactive}
          description="Hidden from customer app"
          icon={XCircle}
          trendType={stats.inactive > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Total Clicks"
          value={stats.totalClicks.toLocaleString()}
          description="Customer engagement & taps"
          icon={MousePointerClick}
          trendType="positive"
        />
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#77746E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, promo offer, salon, or city..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F8F6F1] rounded-xl text-xs text-[#292824] placeholder-[#77746E] border border-transparent focus:border-[#B96F45] focus:bg-white focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F8F6F1] rounded-xl text-xs font-semibold text-[#292824] border border-transparent focus:border-[#B96F45] focus:bg-white focus:outline-hidden transition-all cursor-pointer"
            >
              <option value="ALL">All Statuses ({stats.total})</option>
              <option value="ACTIVE">Active Only ({stats.active})</option>
              <option value="INACTIVE">Inactive / Paused ({stats.inactive})</option>
            </select>
          </div>

          <div>
            <select
              value={salonFilter}
              onChange={(e) => setSalonFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F8F6F1] rounded-xl text-xs font-semibold text-[#292824] border border-transparent focus:border-[#B96F45] focus:bg-white focus:outline-hidden transition-all cursor-pointer"
            >
              <option value="ALL">All Target Salons</option>
              {registeredSalons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sliders List View */}
      {loadingSliders ? (
        <div className="bg-white rounded-2xl border border-[#E9E4DB] p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#B96F45] mx-auto mb-3" />
          <p className="text-xs font-semibold text-[#77746E]">
            Syncing live sliders from Cloud Firestore...
          </p>
        </div>
      ) : filteredSliders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E9E4DB] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#F6ECE5] text-[#B96F45] flex items-center justify-center mx-auto mb-4 border border-[#EBD4C6]">
            <GalleryHorizontal className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#292824] mb-1">
            {searchQuery || statusFilter !== "ALL" || salonFilter !== "ALL"
              ? "No Sliders Match Your Filters"
              : "No Home Sliders Created Yet"}
          </h3>
          <p className="text-xs text-[#77746E] max-w-md mx-auto mb-6">
            {searchQuery || statusFilter !== "ALL" || salonFilter !== "ALL"
              ? "Try adjusting your search criteria or resetting filters to view all promotional carousels."
              : "Create dynamic promotional sliders with custom location coordinates, visibility radius, and salon profile deep-links."}
          </p>

          <div className="flex items-center justify-center gap-3">
            {sliders.length === 0 && (
              <button
                type="button"
                onClick={handleSeedInitialSliders}
                className="px-4 py-2.5 bg-white border border-[#E9E4DB] hover:bg-[#F8F6F1] text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#B96F45]" />
                <span>Seed 3 Production Presets</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-[#B96F45] hover:bg-[#9F5935] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Slider</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSliders.map((slider, index) => {
            const hasStarted = !slider.startsAt || new Date(slider.startsAt) <= new Date();
            const hasEnded = slider.endsAt && new Date(slider.endsAt) < new Date();
            const isCurrentlyScheduled = hasStarted && !hasEnded;

            return (
              <div
                key={slider.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col overflow-hidden ${
                  slider.isActive
                    ? "border-[#E9E4DB]"
                    : "border-[#E9E4DB]/60 opacity-80 bg-[#FCFBF8]"
                }`}
              >
                {/* Image Preview & Badges Header */}
                <div className="relative h-44 w-full bg-[#292824] overflow-hidden group">
                  {slider.imageUrl ? (
                    <img
                      src={slider.imageUrl}
                      alt={slider.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#292824] to-[#1E1D19] text-[#77746E]">
                      <GalleryHorizontal className="w-10 h-10" />
                    </div>
                  )}

                  {/* Gradient overlay for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs border border-white/20">
                      Order #{slider.displayOrder ?? index + 1}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-xs flex items-center gap-1.5 ${
                        slider.isActive
                          ? "bg-[#EBF5EE]/90 text-[#2D6A4F] border border-[#CDE5D4]"
                          : "bg-[#FDECEB]/90 text-[#B3392E] border border-[#F7C2BE]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          slider.isActive ? "bg-[#2D6A4F]" : "bg-[#B3392E]"
                        }`}
                      />
                      {slider.isActive ? "Active (Live)" : "Paused"}
                    </span>
                  </div>

                  {/* Overlay Title & Button text */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-0.5">
                      {slider.buttonText || "Explore Salon"}
                    </span>
                    <h4 className="font-serif font-bold text-sm leading-tight text-white line-clamp-1">
                      {slider.title}
                    </h4>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-xs text-[#77746E] line-clamp-2 leading-relaxed mb-3">
                      {slider.subtitle}
                    </p>

                    {/* Location & Radius Info Card */}
                    <div className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E9E4DB] space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#B96F45] shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#292824] truncate">
                            {slider.salonName || "Selected Salon"}
                          </p>
                          <p className="text-[10px] text-[#77746E] truncate">
                            {slider.salonAddress || "Kanpur, Uttar Pradesh"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E9E4DB]/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-[#54514B]">
                          <Radio className="w-3 h-3 text-[#B96F45]" />
                          <span>
                            {slider.isGlobal ? (
                              <strong className="text-[#2D6A4F]">Global (All Customers)</strong>
                            ) : (
                              <>
                                Radius: <strong>{slider.visibilityRadiusKm || 5.0} km</strong>
                              </>
                            )}
                          </span>
                        </div>

                        <span className="text-[10px] text-[#77746E] font-mono">
                          {Number(slider.targetLatitude || 0).toFixed(4)},{" "}
                          {Number(slider.targetLongitude || 0).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Analytics Meta Row */}
                  <div className="pt-2 border-t border-[#F3EFE8] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenAnalytics(slider)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F6ECE5] hover:bg-[#EBD4C6] text-[#B96F45] font-bold text-[11px] transition-colors cursor-pointer"
                      title="View Click Events"
                    >
                      <MousePointerClick className="w-3.5 h-3.5" />
                      <span>{slider.clickCount || 0} Clicks</span>
                    </button>

                    {/* Promotion Schedule badge */}
                    {slider.startsAt || slider.endsAt ? (
                      <span
                        className={`text-[10px] font-semibold flex items-center gap-1 ${
                          isCurrentlyScheduled ? "text-[#2D6A4F]" : "text-[#9A6700]"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{isCurrentlyScheduled ? "Running Campaign" : "Scheduled"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#77746E] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                        <span>Continuous Promo</span>
                      </span>
                    )}
                  </div>

                  {/* Action Controls Toolbar */}
                  <div className="pt-2 border-t border-[#F3EFE8] flex items-center justify-between gap-1">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorder(slider, "up")}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg border border-[#E9E4DB] hover:bg-[#F8F6F1] disabled:opacity-30 disabled:cursor-not-allowed text-[#292824] transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(slider, "down")}
                        disabled={index === filteredSliders.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg border border-[#E9E4DB] hover:bg-[#F8F6F1] disabled:opacity-30 disabled:cursor-not-allowed text-[#292824] transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Active Switch & Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(slider)}
                        title={slider.isActive ? "Deactivate Slider" : "Activate Slider"}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          slider.isActive
                            ? "bg-[#EBF5EE] text-[#2D6A4F] hover:bg-[#D4EDDA]"
                            : "bg-[#F8F6F1] text-[#77746E] hover:bg-[#E9E4DB]"
                        }`}
                      >
                        {slider.isActive ? "Turn Off" : "Turn On"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(slider)}
                        title="Edit Slider"
                        className="p-1.5 rounded-lg border border-[#E9E4DB] hover:bg-[#F8F6F1] text-[#292824] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteModalState({ isOpen: true, slider })}
                        title="Delete Slider"
                        className="p-1.5 rounded-lg border border-[#F7C2BE] hover:bg-[#FDECEB] text-[#B3392E] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT SLIDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E9E4DB] shadow-2xl p-6 sm:p-8 my-8 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E9E4DB] shrink-0">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#292824]">
                  {editingSlider ? "Edit Promotional Slider" : "Create New Promotional Slider"}
                </h3>
                <p className="text-xs text-[#77746E]">
                  Configure banner headline, target salon, Google Maps pin, and visibility radius.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#77746E] hover:text-[#292824] hover:bg-[#F8F6F1] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-[#FDECEB] border border-[#F7C2BE] text-xs font-semibold text-[#B3392E] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSaveSlider} className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Template Presets Picker (if creating new) */}
              {!editingSlider && (
                <div className="p-3 rounded-2xl bg-[#F8F6F1] border border-[#E9E4DB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B96F45] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quick Templates (Production Presets)
                    </span>
                    <span className="text-[10px] text-[#77746E]">Click to pre-fill</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {INITIAL_SLIDER_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className="p-2 rounded-xl bg-white border border-[#E9E4DB] hover:border-[#B96F45] hover:bg-[#F6ECE5]/30 text-left transition-all cursor-pointer text-xs"
                      >
                        <p className="font-bold text-[#292824] truncate text-[11px]">{p.title}</p>
                        <p className="text-[10px] text-[#77746E] truncate">
                          {p.city} • {p.visibilityRadiusKm} km
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#292824] block">
                    Headline / Title <span className="text-[#B3392E]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Flat 30% Off Hair Spa & Facial"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4DB] text-xs text-[#292824] focus:border-[#B96F45] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#292824] block">Button / CTA Text</label>
                  <input
                    type="text"
                    value={formButtonText}
                    onChange={(e) => setFormButtonText(e.target.value)}
                    placeholder="e.g. Explore Salon"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4DB] text-xs text-[#292824] focus:border-[#B96F45] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#292824] block">
                  Promotional Subtitle / Description <span className="text-[#B3392E]">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="e.g., Book premium haircut with senior stylist. Valid till Sunday."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9E4DB] text-xs text-[#292824] focus:border-[#B96F45] focus:outline-hidden"
                  required
                />
              </div>

              {/* Image Upload & Live Preview */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#292824] flex items-center justify-between">
                  <span>Banner Image (Device Upload / Preview) <span className="text-[#B3392E]">*</span></span>
                  <span className="text-[10px] font-normal text-[#77746E]">Recommended: 1200 x 600 px</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="sm:col-span-1 border-2 border-dashed border-[#E9E4DB] hover:border-[#B96F45] rounded-2xl p-4 text-center cursor-pointer bg-[#F8F6F1] hover:bg-[#F6ECE5]/30 transition-all flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <Upload className="w-6 h-6 text-[#B96F45] mb-2" />
                    <span className="text-xs font-bold text-[#292824] block">Upload Image</span>
                    <span className="text-[10px] text-[#77746E] block mt-0.5">PNG, JPG, WebP up to 12MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Preview Box */}
                  <div className="sm:col-span-2 relative rounded-2xl bg-[#292824] border border-[#E9E4DB] overflow-hidden min-h-[140px] flex items-center justify-center">
                    {formImagePreview ? (
                      <>
                        <img
                          src={formImagePreview}
                          alt="Banner Preview"
                          className="w-full h-full object-cover max-h-44"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none">
                          <span className="text-[9px] font-bold text-[#D4AF37] uppercase">
                            {formButtonText || "Explore Salon"}
                          </span>
                          <span className="text-xs font-bold line-clamp-1">{formTitle || "Headline Preview"}</span>
                          <span className="text-[10px] text-white/80 line-clamp-1">
                            {formSubtitle || "Promotional description preview"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-[#77746E] flex items-center gap-1.5">
                        <GalleryHorizontal className="w-4 h-4" />
                        No image uploaded yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar during active upload */}
                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-[#B96F45]">
                      <span>Uploading to Firebase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E9E4DB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B96F45] transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Target Salon & Location Selection */}
              <div className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#E9E4DB] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#292824] flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#B96F45]" />
                    Target Salon Location
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#54514B]">
                    <input
                      type="checkbox"
                      checked={formIsGlobal}
                      onChange={(e) => setFormIsGlobal(e.target.checked)}
                      className="rounded-sm accent-[#B96F45]"
                    />
                    <span>Global Visibility (Show across all locations)</span>
                  </label>
                </div>

                {/* Salon Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#77746E] block">
                    Choose Registered Salon Brand & Location
                  </label>
                  <select
                    value={formSelectedSalonId}
                    onChange={(e) => handleSalonChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-[#E9E4DB] text-xs font-semibold text-[#292824] focus:border-[#B96F45] focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Select Target Salon...</option>
                    {registeredSalons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.address} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Coordinates & Custom Radius Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#77746E] block">Target Latitude</label>
                    <input
                      type="text"
                      value={formTargetLat}
                      onChange={(e) => setFormTargetLat(e.target.value)}
                      placeholder="e.g. 26.4719"
                      disabled={formIsGlobal}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#E9E4DB] text-xs text-[#292824] focus:border-[#B96F45] focus:outline-hidden disabled:bg-[#F3EFE8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#77746E] block">Target Longitude</label>
                    <input
                      type="text"
                      value={formTargetLng}
                      onChange={(e) => setFormTargetLng(e.target.value)}
                      placeholder="e.g. 80.3524"
                      disabled={formIsGlobal}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#E9E4DB] text-xs text-[#292824] focus:border-[#B96F45] focus:outline-hidden disabled:bg-[#F3EFE8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#77746E] block">
                      Visibility Radius (km)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      value={formVisibilityRadius}
                      onChange={(e) => setFormVisibilityRadius(e.target.value)}
                      placeholder="5.0"
                      disabled={formIsGlobal}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#E9E4DB] text-xs text-[#292824] focus:border-[#B96F45] focus:outline-hidden disabled:bg-[#F3EFE8]"
                    />
                  </div>
                </div>

                {!formIsGlobal && (
                  <p className="text-[11px] text-[#77746E] leading-relaxed">
                    Customer app calculates actual distance using customer’s saved coordinates. Only customers within{" "}
                    <strong className="text-[#292824]">{formVisibilityRadius || 5} km</strong> of (
                    {formTargetLat}, {formTargetLng}) will see this slider.
                  </p>
                )}
              </div>

              {/* Order, Status & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#292824] block">Display Sequence Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9E4DB] text-xs text-[#292824] focus:border-[#B96F45] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[#77746E] block">Lower number appears first (0, 1, 2...)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#292824] block">Initial Status</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#292824]">
                      <input
                        type="radio"
                        name="isActive"
                        checked={formIsActive}
                        onChange={() => setFormIsActive(true)}
                        className="accent-[#B96F45]"
                      />
                      <span>Active (Live)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#77746E]">
                      <input
                        type="radio"
                        name="isActive"
                        checked={!formIsActive}
                        onChange={() => setFormIsActive(false)}
                        className="accent-[#B96F45]"
                      />
                      <span>Paused (Disabled)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Campaign Schedule Dates (Optional) */}
              <div className="p-3.5 rounded-2xl bg-[#F8F6F1] border border-[#E9E4DB] space-y-3">
                <span className="text-[11px] font-bold text-[#292824] block">
                  Campaign Promotion Dates (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#77746E] block mb-1">Starts At</label>
                    <input
                      type="datetime-local"
                      value={formStartsAt}
                      onChange={(e) => setFormStartsAt(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E9E4DB] text-xs text-[#292824]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#77746E] block mb-1">Ends At</label>
                    <input
                      type="datetime-local"
                      value={formEndsAt}
                      onChange={(e) => setFormEndsAt(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E9E4DB] text-xs text-[#292824]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[#E9E4DB] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-[#E9E4DB] text-xs font-semibold text-[#54514B] hover:bg-[#F8F6F1] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#B96F45] hover:bg-[#9F5935] text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <span>{editingSlider ? "Save Changes" : "Publish Slider"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLICK ANALYTICS MODAL */}
      {analyticsModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E9E4DB] shadow-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9E4DB]">
              <div>
                <h3 className="text-base font-bold text-[#292824]">Slider Click Analytics</h3>
                <p className="text-xs text-[#77746E]">
                  Engagement log for &ldquo;{analyticsModalState.slider?.title}&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsModalState({ isOpen: false, slider: null, clicks: [], loading: false })}
                className="p-1.5 rounded-lg text-[#77746E] hover:text-[#292824] hover:bg-[#F8F6F1]"
              >
                ✕
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-[#F6ECE5] border border-[#EBD4C6] flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#B96F45] font-semibold">Total Verified Clicks</p>
                  <p className="text-2xl font-bold text-[#292824]">{analyticsModalState.slider?.clickCount || 0}</p>
                </div>
                <MousePointerClick className="w-7 h-7 text-[#B96F45]" />
              </div>

              <h5 className="text-xs font-bold text-[#292824] pt-2">Recent Click Events (Audit Log)</h5>

              {analyticsModalState.loading ? (
                <div className="py-8 text-center text-xs text-[#77746E]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#B96F45]" />
                  Loading click telemetry...
                </div>
              ) : analyticsModalState.clicks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#77746E] bg-[#F8F6F1] rounded-xl border border-[#E9E4DB]">
                  No individual click events logged yet. Clicks are recorded atomically when customers tap the slider in
                  the mobile app.
                </div>
              ) : (
                <div className="space-y-2">
                  {analyticsModalState.clicks.map((click, i) => {
                    const time = click.clickedAt?.toDate ? click.clickedAt.toDate().toLocaleString() : "Just now";
                    return (
                      <div
                        key={click.id || i}
                        className="p-2.5 rounded-xl border border-[#E9E4DB] bg-[#F8F6F1] text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-[#292824] block">
                            {click.customerId ? `Customer: ${click.customerId.slice(0, 10)}...` : "Guest Customer"}
                          </span>
                          <span className="text-[10px] text-[#77746E]">Session: {click.sessionId || "Direct"}</span>
                        </div>
                        <span className="text-[10px] text-[#77746E]">{time}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E9E4DB] flex justify-end">
              <button
                type="button"
                onClick={() => setAnalyticsModalState({ isOpen: false, slider: null, clicks: [], loading: false })}
                className="px-4 py-2 rounded-xl bg-[#F8F6F1] hover:bg-[#E9E4DB] text-xs font-bold text-[#292824] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, slider: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Promotional Slider?"
        message={`Are you sure you want to permanently delete "${deleteModalState.slider?.title}"? It will immediately stop appearing on customer apps.`}
        confirmText="Delete Slider"
        type="danger"
      />
    </div>
  );
}
