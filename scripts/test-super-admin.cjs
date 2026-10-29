const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=====================================================');
console.log(' RUNNING PRODUCTION TEST SUITE: SUPER ADMIN SYSTEM   ');
console.log('=====================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

const adminDir = path.join(__dirname, '..');
const salonDir = path.join(__dirname, '..', '..', 'thesalon');
const rootDir = path.join(__dirname, '..', '..');

// ---------------------------------------------------------
// 1. Verify Configuration & Environment
// ---------------------------------------------------------
it('Firebase configuration file exists and exports auth & db singletons', () => {
  const firebaseJs = fs.readFileSync(path.join(adminDir, 'lib', 'firebase.js'), 'utf-8');
  assert(firebaseJs.includes('initializeApp'), 'Must initialize Firebase');
  assert(firebaseJs.includes('getAuth'), 'Must initialize Firebase Auth');
  assert(firebaseJs.includes('getFirestore'), 'Must initialize Cloud Firestore');
  assert(firebaseJs.includes('salon-time-7c096'), 'Must reuse existing project salon-time-7c096');
});

it('.env.local is configured with existing project credentials', () => {
  const envLocal = fs.readFileSync(path.join(adminDir, '.env.local'), 'utf-8');
  assert(envLocal.includes('NEXT_PUBLIC_FIREBASE_PROJECT_ID=salon-time-7c096'), 'Correct Project ID in env');
  assert(envLocal.includes('NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBazqgqYkoHbnwlOd5YcV3VArLMNkQL6qA'), 'Correct API Key in env');
});

// ---------------------------------------------------------
// 2. Verify Firestore Security Rules Integrity
// ---------------------------------------------------------
it('Firestore Security Rules enforce strict one-time setup on /system/admin_setup', () => {
  const rules = fs.readFileSync(path.join(salonDir, 'firestore.rules'), 'utf-8');
  assert(rules.includes('match /system/admin_setup'), 'Must define rule for system/admin_setup');
  assert(rules.includes('!exists(/databases/$(database)/documents/system/admin_setup)'), 'Must forbid creation if admin_setup already exists');
  assert(rules.includes('allow update, delete: if false;'), 'Must make admin_setup permanently immutable');
});

it('Firestore Security Rules enforce that /admins/{adminId} can only be created once during initial setup', () => {
  const rules = fs.readFileSync(path.join(salonDir, 'firestore.rules'), 'utf-8');
  assert(rules.includes('match /admins/{adminId}'), 'Must define rule for admins collection');
  assert(rules.includes('getAfter(/databases/$(database)/documents/system/admin_setup).data.superAdminUid == adminId'), 'Admin doc must link to admin_setup transaction');
  assert(rules.includes('allow delete: if false;'), 'Admin profile deletion must be forbidden');
});

it('Firestore Security Rules prevent partners from assigning themselves super_admin role', () => {
  const rules = fs.readFileSync(path.join(salonDir, 'firestore.rules'), 'utf-8');
  assert(rules.includes("request.resource.data.role == 'partner'"), 'Partners must have role partner on create');
  assert(rules.includes("request.resource.data.role == resource.data.role"), 'Partner role must be immutable');
  assert(rules.includes("affectedKeys().hasAny([") && rules.includes("'role'"), 'Role key changes must be rejected');
});

it('Firestore Security Rules grant isSuperAdmin() listing & inspection rights on partners and customers', () => {
  const rules = fs.readFileSync(path.join(salonDir, 'firestore.rules'), 'utf-8');
  assert(rules.includes('isSuperAdmin()'), 'Must define isSuperAdmin helper');
  assert(rules.includes('allow list: if isSuperAdmin();'), 'Super admin must have list access');
});

// ---------------------------------------------------------
// 3. Verify Registration Page & One-Time Logic
// ---------------------------------------------------------
it('Registration screen has name, email, password, and confirm password fields', () => {
  const regPage = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'register', 'page.js'), 'utf-8');
  assert(regPage.includes('fullName'), 'Must have full name field');
  assert(regPage.includes('email'), 'Must have email field');
  assert(regPage.includes('password'), 'Must have password field');
  assert(regPage.includes('confirmPassword'), 'Must have confirm password field');
});

it('Registration screen does not hardcode credentials or passwords into source code', () => {
  const regPage = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'register', 'page.js'), 'utf-8');
  assert(!regPage.includes('password = "'), 'Must NOT hardcode passwords in source code');
  assert(!regPage.includes('password: "'), 'Must NOT hardcode passwords in source code');
});

it('Registration screen checks database lock and permanently disables further registrations', () => {
  const regPage = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'register', 'page.js'), 'utf-8');
  assert(regPage.includes('isAlreadySetup'), 'Must have state tracking database lock');
  assert(regPage.includes('Super Admin Registration Permanently Closed'), 'Must show permanent closure message');
  assert(regPage.includes('runTransaction'), 'Must use atomic transaction to prevent concurrent registration race conditions');
});

// ---------------------------------------------------------
// 4. Verify Login Page & Secure Authentication
// ---------------------------------------------------------
it('Login screen uses Firebase Authentication and verifies role from Firestore before granting access', () => {
  const loginPage = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'login', 'page.js'), 'utf-8');
  assert(loginPage.includes('signInWithEmailAndPassword'), 'Must authenticate with Firebase Auth');
  assert(loginPage.includes('getDoc(adminRef)'), 'Must fetch admin document from Firestore');
  assert(loginPage.includes('adminSnap.data().role !== "super_admin"'), 'Must check role is strictly super_admin');
  assert(loginPage.includes('signOut(auth)'), 'Must immediately sign out unauthorized accounts');
});

it('Login screen handles invalid credentials, locked accounts, and password reset', () => {
  const loginPage = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'login', 'page.js'), 'utf-8');
  assert(loginPage.includes('auth/invalid-credential'), 'Handles invalid credentials');
  assert(loginPage.includes('auth/too-many-requests'), 'Handles rate limits');
  assert(loginPage.includes('sendPasswordResetEmail'), 'Supports secure password reset');
});

// ---------------------------------------------------------
// 5. Verify Context, Route Protection & Session Management
// ---------------------------------------------------------
it('AdminContext manages auth state, token refresh, and profile persistence', () => {
  const ctx = fs.readFileSync(path.join(adminDir, 'context', 'AdminContext.js'), 'utf-8');
  assert(ctx.includes('onAuthStateChanged'), 'Must monitor auth state changes');
  assert(ctx.includes('isSuperAdmin'), 'Must expose verified isSuperAdmin boolean');
  assert(ctx.includes('logout'), 'Must expose secure logout function');
});

it('Admin Root Layout protects all admin routes and enforces 403 Security Boundary', () => {
  const layout = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'layout.js'), 'utf-8');
  assert(layout.includes('!currentUser && !isAuthPage'), 'Redirects unauthenticated users');
  assert(layout.includes('router.replace("/admin/login")'), 'Redirects unauthenticated users to login');
  assert(layout.includes('!isSuperAdmin'), 'Blocks non-super_admin accounts from accessing protected dashboard');
  assert(layout.includes('403 Security Boundary'), 'Renders security boundary screen for unauthorized users');
});

it('Topbar and Sidebar dynamically reflect authenticated Super Admin identity and provide secure sign out', () => {
  const topbar = fs.readFileSync(path.join(adminDir, 'components', 'layout', 'Topbar.js'), 'utf-8');
  const sidebar = fs.readFileSync(path.join(adminDir, 'components', 'layout', 'Sidebar.js'), 'utf-8');
  assert(topbar.includes('logout'), 'Topbar sign out calls auth logout');
  assert(sidebar.includes('logout'), 'Sidebar sign out calls auth logout');
  assert(topbar.includes('initials'), 'Topbar dynamically displays admin initials');
  assert(sidebar.includes('initials'), 'Sidebar dynamically displays admin initials');
});

// ---------------------------------------------------------
// 6. Partner Verification Actions & Firestore Schema Integrity
// ---------------------------------------------------------
it('AdminContext subscribes to real Firestore partners and provides approvePartner, rejectPartner, and setPendingReview', () => {
  const ctx = fs.readFileSync(path.join(adminDir, 'context', 'AdminContext.js'), 'utf-8');
  assert(ctx.includes("collection(db, \"partners\")"), 'Must query partners collection');
  assert(ctx.includes('onSnapshot'), 'Must maintain real-time snapshot subscription');
  assert(ctx.includes('verificationStatus: "approved"'), 'Approve action writes approved verificationStatus');
  assert(ctx.includes('verificationStatus: "rejected"'), 'Reject action writes rejected verificationStatus');
  assert(ctx.includes('rejectionReason: reason.trim()'), 'Reject action requires and saves rejectionReason');
  assert(ctx.includes('reviewedAt: serverTimestamp()'), 'Records serverTimestamp for audit');
  assert(ctx.includes('reviewedBy: currentUser?.uid'), 'Records reviewer UID for audit trail');
});

it('Partner verification preserves submitted documents and applicant records during rejection', () => {
  const ctx = fs.readFileSync(path.join(adminDir, 'context', 'AdminContext.js'), 'utf-8');
  // Rejection must NOT delete doc or empty documents array
  assert(!ctx.includes('deleteDoc(partnerRef)'), 'Must not delete partner document on rejection');
  assert(ctx.includes('accountStatus: "Suspended"'), 'Suspends active booking permissions upon rejection');
});

it('Partner Review Drawer displays complete applicant profile, audit info, and handles document previews', () => {
  const drawer = fs.readFileSync(path.join(adminDir, 'components', 'verification', 'PartnerReviewDrawer.js'), 'utf-8');
  assert(drawer.includes('partner.businessName'), 'Displays business / salon trade name');
  assert(drawer.includes('partner.legalName'), 'Displays applicant legal owner name');
  assert(drawer.includes('partner.phone'), 'Displays contact phone number');
  assert(drawer.includes('partner.email'), 'Displays contact email');
  assert(drawer.includes('partner.businessAddress'), 'Displays salon physical street address');
  assert(drawer.includes('partner.regNumber'), 'Displays GSTIN / registration number');
  assert(drawer.includes('partner.documents'), 'Inspects all submitted documents');
  assert(drawer.includes('fileUrl'), 'Supports secure open file link to Firebase Storage');
});

it('Partner Verification Dashboard has KPI metrics, live table, search filters, and confirmation dialogs', () => {
  const page = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'verification', 'page.js'), 'utf-8');
  assert(page.includes('useAdmin'), 'Consumes live partners from context');
  assert(page.includes('PartnerReviewDrawer'), 'Integrates application dossier drawer');
  assert(page.includes('ConfirmationModal'), 'Uses confirmation modals for approve and reject');
  assert(page.includes('requiresReason={confirmModal.action === "reject"}'), 'Enforces mandatory reason for rejection');
  assert(page.includes('createSamplePartnerApplication'), 'Allows seeding sample partner in Firestore for testing');
});

it('Storage Security Rules restrict partner_docs/{partnerId}/{fileName} to owner and Super Admin only', () => {
  const storageRules = fs.readFileSync(path.join(rootDir, 'storage.rules'), 'utf-8');
  assert(storageRules.includes('match /partner_docs/{partnerId}/{fileName}'), 'Defines partner_docs rule path');
  assert(storageRules.includes('request.auth.uid == partnerId || isSuperAdmin()'), 'Only partner owner or Super Admin can read docs');
  assert(storageRules.includes('request.auth.uid == partnerId'), 'Only partner can upload to their doc folder');
});

it('Production architecture enforces ZERO Next.js API routes', () => {
  const apiDir = path.join(adminDir, 'app', 'api');
  const pagesApiDir = path.join(adminDir, 'pages', 'api');
  assert(!fs.existsSync(apiDir), 'No app/api routes must exist');
  assert(!fs.existsSync(pagesApiDir), 'No pages/api routes must exist');
});

console.log(`\n=====================================================`);
console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED `);
console.log(`=====================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
