export const BRAND = {
  name: "The Salon Times",
  adminName: "The Salon Times — Admin",
  tagline: "Platform management, made simple.",
  supportEmail: "admin-desk@thesalontimes.com",
};

export const COLORS = {
  background: "#F8F6F1",
  surface: "#FFFFFF",
  primary: "#B96F45",
  primaryHover: "#9F5935",
  primaryLight: "#F6ECE5",
  textPrimary: "#292824",
  textSecondary: "#77746E",
  border: "#E9E4DB",
  gold: "#D9BD83",
  goldLight: "#FBF8EE",
  success: "#2D6A4F",
  successBg: "#EBF5EE",
  warning: "#9A6700",
  warningBg: "#FEF6E9",
  error: "#B3392E",
  errorBg: "#FDECEB",
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Partners", href: "/admin/partners", icon: "Users" },
  { label: "Document Verification", href: "/admin/verification", icon: "FileCheck" },
  { label: "Salons", href: "/admin/salons", icon: "Store" },
  { label: "Branches", href: "/admin/branches", icon: "GitBranch" },
  { label: "Bookings", href: "/admin/bookings", icon: "CalendarCheck" },
  { label: "Services", href: "/admin/services", icon: "Scissors" },
  { label: "Customers", href: "/admin/customers", icon: "UserCheck" },
  { label: "Feature Permissions", href: "/admin/permissions", icon: "ShieldCheck" },
  { label: "Activity Logs", href: "/admin/activity-logs", icon: "ClipboardList" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];

export const FEATURE_MODULES = [
  {
    key: "salonProfile",
    name: "Salon Profile Management",
    description: "Manage salon branding, timings, amenities, and gallery.",
    category: "Core",
  },
  {
    key: "branchManagement",
    name: "Branch Management",
    description: "Add, modify, and assign managers to multiple physical branches.",
    category: "Operations",
  },
  {
    key: "serviceManagement",
    name: "Service Management",
    description: "Create and update haircut, grooming, and spa service menus.",
    category: "Catalog",
  },
  {
    key: "staffManagement",
    name: "Staff Management",
    description: "Assign stylists, schedule shifts, and manage individual commissions.",
    category: "Operations",
  },
  {
    key: "appointmentManagement",
    name: "Appointment Management",
    description: "Real-time calendar view and manual slot allocations.",
    category: "Operations",
  },
  {
    key: "bookingManagement",
    name: "Booking Management",
    description: "Accept, reschedule, or cancel customer appointments.",
    category: "Operations",
  },
  {
    key: "homeService",
    name: "Home Service",
    description: "Offer doorstep grooming and beauty packages to customers.",
    category: "Growth",
  },
  {
    key: "offersDiscounts",
    name: "Offers and Discounts",
    description: "Run promo codes, festival campaigns, and off-peak discounts.",
    category: "Growth",
  },
  {
    key: "earningsReports",
    name: "Earnings and Reports",
    description: "Financial analytics, payouts, GST breakdowns, and reports.",
    category: "Financials",
  },
  {
    key: "customerReviews",
    name: "Customer Reviews",
    description: "View ratings, respond to customer feedback, and dispute reviews.",
    category: "Growth",
  },
];

export const DOCUMENT_TYPES = [
  "Government ID",
  "Business Registration",
  "Address Proof",
  "Salon Photos",
  "Trade License",
];

export const STATUS_COLORS = {
  // Verification / General statuses
  Approved: { text: "text-[#2D6A4F]", bg: "bg-[#EBF5EE]", border: "border-[#C6E2D0]" },
  Verified: { text: "text-[#2D6A4F]", bg: "bg-[#EBF5EE]", border: "border-[#C6E2D0]" },
  Active: { text: "text-[#2D6A4F]", bg: "bg-[#EBF5EE]", border: "border-[#C6E2D0]" },
  Confirmed: { text: "text-[#2D6A4F]", bg: "bg-[#EBF5EE]", border: "border-[#C6E2D0]" },
  Completed: { text: "text-[#2D6A4F]", bg: "bg-[#EBF5EE]", border: "border-[#C6E2D0]" },

  "Pending Verification": { text: "text-[#9A6700]", bg: "bg-[#FEF6E9]", border: "border-[#F7E1B5]" },
  "Under Review": { text: "text-[#9A6700]", bg: "bg-[#FEF6E9]", border: "border-[#F7E1B5]" },
  Pending: { text: "text-[#9A6700]", bg: "bg-[#FEF6E9]", border: "border-[#F7E1B5]" },
  "Resubmission Requested": { text: "text-[#9A6700]", bg: "bg-[#FEF6E9]", border: "border-[#F7E1B5]" },

  Rejected: { text: "text-[#B3392E]", bg: "bg-[#FDECEB]", border: "border-[#F7C2BE]" },
  Suspended: { text: "text-[#B3392E]", bg: "bg-[#FDECEB]", border: "border-[#F7C2BE]" },
  Cancelled: { text: "text-[#B3392E]", bg: "bg-[#FDECEB]", border: "border-[#F7C2BE]" },
  Blocked: { text: "text-[#B3392E]", bg: "bg-[#FDECEB]", border: "border-[#F7C2BE]" },
  Inactive: { text: "text-[#77746E]", bg: "bg-[#F2EFE9]", border: "border-[#E1DDD4]" },

  // Service modes
  "Salon Visit": { text: "text-[#B96F45]", bg: "bg-[#F6ECE5]", border: "border-[#EBD4C6]" },
  "Home Service": { text: "text-[#885B28]", bg: "bg-[#FDF6E9]", border: "border-[#EFE1C5]" },
  Both: { text: "text-[#292824]", bg: "bg-[#F0EEE8]", border: "border-[#DFDAD0]" },
};
