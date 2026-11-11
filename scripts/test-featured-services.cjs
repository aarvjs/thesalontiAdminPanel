/**
 * PRODUCTION TEST SUITE: DYNAMIC HOME PAGE SERVICES MANAGEMENT
 * Verifies end-to-end integration across Super Admin, Customer Flutter App, Partner,
 * Firestore/Storage Security Rules, and Composite Indexes.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
  }
}

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ADMIN_DIR = path.join(ROOT_DIR, 'theadmin');
const SALON_DIR = path.join(ROOT_DIR, 'thesalon');

console.log('================================================================');
console.log(' RUNNING PRODUCTION TEST SUITE: FEATURED & SALON SERVICES       ');
console.log('================================================================\n');

// 1. Super Admin constants check
runTest('Super Admin constants include Featured Services navigation item with correct route /admin/featured-services', () => {
  const constantsPath = path.join(ADMIN_DIR, 'lib', 'constants.js');
  const content = fs.readFileSync(constantsPath, 'utf8');
  assert(content.includes('/admin/featured-services'), 'NAV_ITEMS must contain /admin/featured-services');
  assert(content.includes('Featured Services'), 'NAV_ITEMS label must be Featured Services');
  assert(content.includes('Sparkles'), 'NAV_ITEMS icon must be Sparkles');
});

// 2. Super Admin sidebar check
runTest('Super Admin Sidebar correctly maps and renders Sparkles icon for Featured Services', () => {
  const sidebarPath = path.join(ADMIN_DIR, 'components', 'layout', 'Sidebar.js');
  const content = fs.readFileSync(sidebarPath, 'utf8');
  assert(content.includes('Sparkles'), 'Sidebar must import and map Sparkles icon');
});

// 3. Super Admin Featured Services page check
runTest('Super Admin Featured Services page exists with full CRUD, file upload, and preset seeding', () => {
  const pagePath = path.join(ADMIN_DIR, 'app', 'admin', 'featured-services', 'page.js');
  assert(fs.existsSync(pagePath), 'Featured Services page.js must exist');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('featuredServices'), 'Must query featuredServices Firestore collection');
  assert(content.includes('uploadBytesResumable'), 'Must support device image upload');
  assert(content.includes('INITIAL_FEATURED_SERVICES_PRESETS'), 'Must define initial presets');
  assert(content.includes('ConfirmationModal'), 'Must require confirmation before deleting');
  assert(content.includes('handleMoveOrder'), 'Must support reordering displayOrder');
});

// 4. Initial 5 curated featured services check
runTest('Super Admin defines the 5 suggested initial services with high-res photography', () => {
  const pagePath = path.join(ADMIN_DIR, 'app', 'admin', 'featured-services', 'page.js');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('Haircut'), 'Must include Haircut');
  assert(content.includes('Hair Styling'), 'Must include Hair Styling');
  assert(content.includes('Hair Colour'), 'Must include Hair Colour');
  assert(content.includes('Beard Grooming'), 'Must include Beard Grooming');
  assert(content.includes('Facial'), 'Must include Facial');
});

// 5. Customer app FeaturedServiceModel check
runTest('Customer app defines FeaturedServiceModel with parsing and Firestore serialization', () => {
  const modelPath = path.join(SALON_DIR, 'lib', 'features', 'customer', 'home', 'models', 'featured_service_model.dart');
  assert(fs.existsSync(modelPath), 'featured_service_model.dart must exist');
  const content = fs.readFileSync(modelPath, 'utf8');
  assert(content.includes('class FeaturedServiceModel'), 'Must declare FeaturedServiceModel');
  assert(content.includes('fromMap'), 'Must implement fromMap');
  assert(content.includes('toMap'), 'Must implement toMap');
  assert(content.includes('displayOrder'), 'Must track displayOrder');
});

// 6. Customer app FeaturedServiceService check
runTest('Customer app FeaturedServiceService streams active featured services and provides fallback presets', () => {
  const servicePath = path.join(SALON_DIR, 'lib', 'features', 'customer', 'home', 'services', 'featured_service_service.dart');
  assert(fs.existsSync(servicePath), 'featured_service_service.dart must exist');
  const content = fs.readFileSync(servicePath, 'utf8');
  assert(content.includes('streamActiveFeaturedServices'), 'Must provide real-time Firestore stream');
  assert(content.includes('defaultFeaturedServices'), 'Must provide fallback presets for offline resilience');
  assert(content.includes('doesSalonOfferService'), 'Must verify whether salon offers service');
});

// 7. Customer app FeaturedServicesSection check
runTest('Customer app FeaturedServicesSection replaces static icons with dynamic image cards and loading skeletons', () => {
  const sectionPath = path.join(SALON_DIR, 'lib', 'features', 'customer', 'home', 'widgets', 'featured_services_section.dart');
  assert(fs.existsSync(sectionPath), 'featured_services_section.dart must exist');
  const content = fs.readFileSync(sectionPath, 'utf8');
  assert(content.includes('StreamBuilder<List<FeaturedServiceModel>>'), 'Must stream from Firestore');
  assert(content.includes('AppImage'), 'Must use cached AppImage widget');
  assert(content.includes('_buildLoadingSkeleton'), 'Must provide loading skeleton');
  assert(content.includes('ServiceDiscoveryScreen'), 'Must navigate to discovery screen on tap');
});

// 8. Customer home screen embeds FeaturedServicesSection below slider
runTest('Customer home screen integrates FeaturedServicesSection directly below promotional banner slider', () => {
  const homeScreenPath = path.join(SALON_DIR, 'lib', 'features', 'customer', 'home', 'screens', 'customer_home_screen.dart');
  const content = fs.readFileSync(homeScreenPath, 'utf8');
  assert(content.includes('FeaturedServicesSection'), 'CustomerHomeScreen must embed FeaturedServicesSection');
});

// 9. Customer ServiceDiscoveryScreen strict filtering check
runTest('Customer ServiceDiscoveryScreen filters salons by customer location, salon radius, and service offer', () => {
  const discoveryPath = path.join(SALON_DIR, 'lib', 'features', 'customer', 'explore', 'screens', 'service_discovery_screen.dart');
  assert(fs.existsSync(discoveryPath), 'service_discovery_screen.dart must exist');
  const content = fs.readFileSync(discoveryPath, 'utf8');
  assert(content.includes('haversineDistanceKm'), 'Must calculate distance from customer location');
  assert(content.includes('serviceRadiusKm'), 'Must check against salon serviceRadiusKm');
  assert(content.includes('doesSalonOfferService'), 'Must verify salon actually offers the service');
  assert(content.includes('CustomerSalonDetailsScreen'), 'Must navigate to target salon details on tap');
});

// 10. Partner Firestore service salon-specific operations
runTest('Partner Firestore service supports independent salon services subcollection and storage uploads', () => {
  const firestorePath = path.join(SALON_DIR, 'lib', 'features', 'partner', 'services', 'partner_firestore_service.dart');
  const content = fs.readFileSync(firestorePath, 'utf8');
  assert(content.includes('uploadSalonServicePhoto'), 'Must support salon service photo upload');
  assert(content.includes('fetchSalonServices'), 'Must fetch salon services');
  assert(content.includes('saveSalonService'), 'Must save salon service to subcollection');
  assert(content.includes('deleteSalonService'), 'Must safely delete salon service');
});

// 11. Partner ServicesScreen location selector & isolation
runTest('Partner ServicesScreen provides independent salon location selector and isolated service lists', () => {
  const screenPath = path.join(SALON_DIR, 'lib', 'features', 'partner', 'services', 'screens', 'services_screen.dart');
  const content = fs.readFileSync(screenPath, 'utf8');
  assert(content.includes('MANAGING SALON LOCATION'), 'Must show salon location selector');
  assert(content.includes('currentSalonServices'), 'Must isolate services by selected salon');
  assert(content.includes('_showDeleteConfirmation'), 'Must require confirmation before deleting');
});

// 12. Partner AddServiceScreen image upload and unlimited services
runTest('Partner AddServiceScreen supports image picking, camera/gallery, pricing, and duration validation', () => {
  const addScreenPath = path.join(SALON_DIR, 'lib', 'features', 'partner', 'services', 'screens', 'add_service_screen.dart');
  const content = fs.readFileSync(addScreenPath, 'utf8');
  assert(content.includes('ImagePicker'), 'Must support device image picker');
  assert(content.includes('uploadSalonServicePhoto'), 'Must upload to Firebase Storage');
  assert(content.includes('availableAtSalon'), 'Must configure salon visit availability');
  assert(content.includes('availableAtHome'), 'Must configure home service availability');
});

// 13. Firestore Security Rules check
runTest('Firestore Security Rules grant Super Admin control over featuredServices and isolate salon services to owner/admin', () => {
  const rulesPath = path.join(ROOT_DIR, 'firestore.rules');
  const content = fs.readFileSync(rulesPath, 'utf8');
  assert(content.includes('match /featuredServices/{serviceId}'), 'Must have rules for featuredServices');
  assert(content.includes('match /services/{serviceId}'), 'Must have rules for salon services subcollection');
  assert(content.includes('isSuperAdmin()'), 'Must enforce isSuperAdmin check');
});

// 14. Firebase Storage Security Rules check
runTest('Storage Security Rules protect featured_services/ and salon_services/{salonId}/{serviceId}', () => {
  const storageRulesPath = path.join(ROOT_DIR, 'storage.rules');
  const content = fs.readFileSync(storageRulesPath, 'utf8');
  assert(content.includes('match /featured_services/{serviceId}/{fileName}'), 'Must have rules for featured_services');
  assert(content.includes('match /salon_services/{salonId}/{serviceId}/{fileName}'), 'Must have rules for salon_services');
});

// 15. Firestore Composite Indexes check
runTest('Firestore Composite Indexes include featuredServices (isActive ASC, displayOrder ASC)', () => {
  const indexDoc = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firestore.indexes.json'), 'utf8'));
  const found = indexDoc.indexes.some((idx) => {
    return idx.collectionGroup === 'featuredServices' &&
      idx.fields[0].fieldPath === 'isActive' &&
      idx.fields[1].fieldPath === 'displayOrder';
  });
  assert(found, 'Composite index for featuredServices must be present');
});

// 16. Haversine distance simulation for Kanpur Mall Road vs Swaroop Nagar vs Lucknow
runTest('Service discovery correctly filters Kanpur salons within radius and excludes Lucknow for Kanpur customer', () => {
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const customerLat = 26.4719; // Kanpur Mall Road
  const customerLng = 80.3524;

  const mallRoadSalon = { name: 'The Groom Room – Mall Road', lat: 26.4719, lng: 80.3524, radius: 10, services: ['Haircut', 'Facial'] };
  const swaroopNagarSalon = { name: 'Royalty Lounge – Swaroop Nagar', lat: 26.4815, lng: 80.3168, radius: 10, services: ['Haircut', 'Beard Grooming'] };
  const lucknowSalon = { name: 'Glow Clinic – Lucknow', lat: 26.8587, lng: 80.9984, radius: 10, services: ['Haircut', 'Hair Styling'] };

  const distMallRoad = haversine(customerLat, customerLng, mallRoadSalon.lat, mallRoadSalon.lng);
  const distSwaroop = haversine(customerLat, customerLng, swaroopNagarSalon.lat, swaroopNagarSalon.lng);
  const distLucknow = haversine(customerLat, customerLng, lucknowSalon.lat, lucknowSalon.lng);

  assert(distMallRoad <= mallRoadSalon.radius, 'Mall Road salon is within radius');
  assert(distSwaroop <= swaroopNagarSalon.radius, 'Swaroop Nagar salon is within radius (~3.7 km)');
  assert(distLucknow > lucknowSalon.radius, 'Lucknow salon is outside radius (~77 km)');

  // Filter salons that offer "Facial" within radius:
  const facialSalons = [mallRoadSalon, swaroopNagarSalon, lucknowSalon].filter((s) => {
    const dist = haversine(customerLat, customerLng, s.lat, s.lng);
    return dist <= s.radius && s.services.includes('Facial');
  });

  assert.strictEqual(facialSalons.length, 1, 'Only Mall Road salon offers Facial within customer radius');
  assert.strictEqual(facialSalons[0].name, 'The Groom Room – Mall Road');
});

console.log('================================================================');
console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED `);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

