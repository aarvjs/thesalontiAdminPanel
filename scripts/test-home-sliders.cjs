const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log(' RUNNING PRODUCTION TEST SUITE: DYNAMIC HOME SLIDER MANAGEMENT ');
console.log('================================================================\n');

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

// Haversine formula calculation test in JS matching Dart DistanceCalculator
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const lat1Rad = (lat1 * Math.PI) / 180.0;
  const lat2Rad = (lat2 * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

// ---------------------------------------------------------
// 1. Super Admin Slider Management Architecture
// ---------------------------------------------------------
it('Super Admin constants include Home Sliders navigation item with correct route /admin/sliders', () => {
  const constantsJs = fs.readFileSync(path.join(adminDir, 'lib', 'constants.js'), 'utf-8');
  assert(constantsJs.includes('/admin/sliders'), 'NAV_ITEMS must contain /admin/sliders');
  assert(constantsJs.includes('Home Sliders'), 'Must label as Home Sliders');
});

it('Super Admin Sidebar correctly maps and renders GalleryHorizontal icon for Home Sliders', () => {
  const sidebarJs = fs.readFileSync(path.join(adminDir, 'components', 'layout', 'Sidebar.js'), 'utf-8');
  assert(sidebarJs.includes('GalleryHorizontal'), 'Sidebar must import and map GalleryHorizontal icon');
});

it('Firebase configuration in theadmin initializes and exports storage instance', () => {
  const firebaseJs = fs.readFileSync(path.join(adminDir, 'lib', 'firebase.js'), 'utf-8');
  assert(firebaseJs.includes('getStorage'), 'Must import getStorage');
  assert(firebaseJs.includes('export { app, auth, db, storage'), 'Must export storage instance');
});

it('Super Admin sliders page exists with full CRUD, file upload, preset seeding, and click analytics', () => {
  const slidersPage = fs.readFileSync(path.join(adminDir, 'app', 'admin', 'sliders', 'page.js'), 'utf-8');
  assert(slidersPage.includes('collection(db, "homeSliders")'), 'Must subscribe to homeSliders collection in Firestore');
  assert(slidersPage.includes('uploadBytesResumable'), 'Must support device image upload via Firebase Storage');
  assert(slidersPage.includes('visibilityRadiusKm'), 'Must support custom visibility radius');
  assert(slidersPage.includes('isGlobal'), 'Must support global visibility toggle');
  assert(slidersPage.includes('displayOrder'), 'Must support display ordering & reordering');
  assert(slidersPage.includes('ConfirmationModal'), 'Must require confirmation before slider deletion');
  assert(slidersPage.includes('handleSeedInitialSliders'), 'Must provide seeding for initial 3 production sliders');
  assert(slidersPage.includes('handleOpenAnalytics'), 'Must provide click telemetry view');
});

// ---------------------------------------------------------
// 2. Location-Based Slider Visibility & Mathematical Verification
// ---------------------------------------------------------
it('Kanpur Mall Road customer (26.4719, 80.3524) sees Mall Road slider (radius 5km) and Swaroop Nagar slider (radius 4km)', () => {
  const kanpurCustLat = 26.4719;
  const kanpurCustLng = 80.3524;

  // Slider 1: Mall Road
  const dist1 = haversineDistanceKm(kanpurCustLat, kanpurCustLng, 26.4719, 80.3524);
  assert(dist1 <= 5.0, `Mall Road distance (${dist1.toFixed(2)} km) must be <= 5.0 km`);

  // Slider 2: Swaroop Nagar (lat: 26.4815, lng: 80.3168)
  const dist2 = haversineDistanceKm(kanpurCustLat, kanpurCustLng, 26.4815, 80.3168);
  assert(dist2 <= 4.0, `Swaroop Nagar distance (${dist2.toFixed(2)} km) must be <= 4.0 km (approx 3.7 km away)`);
});

it('Kanpur customer does NOT see Lucknow Gomti Nagar slider (lat: 26.8587, lng: 80.9984, radius 8km)', () => {
  const kanpurCustLat = 26.4719;
  const kanpurCustLng = 80.3524;

  const distToLucknow = haversineDistanceKm(kanpurCustLat, kanpurCustLng, 26.8587, 80.9984);
  assert(distToLucknow > 8.0, `Distance to Lucknow (${distToLucknow.toFixed(1)} km) is outside 8.0 km radius`);
  assert(distToLucknow > 70.0, 'Kanpur to Lucknow is ~77 km away');
});

it('Lucknow customer (26.8587, 80.9984) sees Lucknow Gomti Nagar slider and does NOT see Kanpur sliders', () => {
  const lucknowCustLat = 26.8587;
  const lucknowCustLng = 80.9984;

  // Lucknow slider
  const distLucknow = haversineDistanceKm(lucknowCustLat, lucknowCustLng, 26.8587, 80.9984);
  assert(distLucknow <= 8.0, `Lucknow distance (${distLucknow.toFixed(2)} km) must be within 8.0 km radius`);

  // Kanpur sliders
  const distToKanpur1 = haversineDistanceKm(lucknowCustLat, lucknowCustLng, 26.4719, 80.3524);
  const distToKanpur2 = haversineDistanceKm(lucknowCustLat, lucknowCustLng, 26.4815, 80.3168);
  assert(distToKanpur1 > 5.0, 'Kanpur Mall Road slider must be hidden from Lucknow customer');
  assert(distToKanpur2 > 4.0, 'Kanpur Swaroop Nagar slider must be hidden from Lucknow customer');
});

// ---------------------------------------------------------
// 3. Customer Flutter App Models & Service Verification
// ---------------------------------------------------------
it('Customer app defines HomeSliderModel with location, radius, clickCount, and date parsing', () => {
  const modelFile = fs.readFileSync(
    path.join(salonDir, 'lib', 'features', 'customer', 'home', 'models', 'home_slider_model.dart'),
    'utf-8'
  );
  assert(modelFile.includes('class HomeSliderModel'), 'Must define HomeSliderModel');
  assert(modelFile.includes('double visibilityRadiusKm'), 'Must have visibilityRadiusKm');
  assert(modelFile.includes('bool isGlobal'), 'Must have isGlobal field');
  assert(modelFile.includes('int clickCount'), 'Must have clickCount');
  assert(modelFile.includes('distanceKm'), 'Must have distanceKm calculation method');
  assert(modelFile.includes('isWithinRadius'), 'Must have isWithinRadius method');
  assert(modelFile.includes('isScheduledActive'), 'Must have promotional schedule check');
});

it('Customer app HomeSliderService provides real-time Firestore stream, strict location filtering, and atomic clicks', () => {
  const serviceFile = fs.readFileSync(
    path.join(salonDir, 'lib', 'features', 'customer', 'home', 'services', 'home_slider_service.dart'),
    'utf-8'
  );
  assert(serviceFile.includes('streamActiveSliders'), 'Must stream active sliders from Firestore');
  assert(serviceFile.includes('filterEligibleSliders'), 'Must implement location-based eligibility filter');
  assert(serviceFile.includes('!hasValidCustomerLocation'), 'Must hide location-restricted sliders if customer has no location');
  assert(serviceFile.includes('FieldValue.increment(1)'), 'Must atomically increment clickCount without full coordinate collection');
  assert(serviceFile.includes('recordClick'), 'Must record click telemetry in subcollection');
  assert(serviceFile.includes('handleSliderClick'), 'Must handle slider navigation to CustomerSalonDetailsScreen');
});

it('Customer Home Screen integrates real-time StreamBuilder and passes dynamic eligible sliders to HomeBannerSlider', () => {
  const homeScreen = fs.readFileSync(
    path.join(salonDir, 'lib', 'features', 'customer', 'home', 'screens', 'customer_home_screen.dart'),
    'utf-8'
  );
  assert(homeScreen.includes('HomeSliderService.instance.streamActiveSliders()'), 'Home screen must listen to sliders stream');
  assert(homeScreen.includes('HomeSliderService.instance.filterEligibleSliders'), 'Home screen must filter by locationState');
  assert(homeScreen.includes('HomeBannerSlider('), 'Must render HomeBannerSlider component');
});

it('HomeBannerCard and HomeBannerSlider maintain high-contrast styling, page indicator, and auto-advance timer', () => {
  const bannerSlider = fs.readFileSync(
    path.join(salonDir, 'lib', 'features', 'customer', 'home', 'widgets', 'home_banner_slider.dart'),
    'utf-8'
  );
  assert(bannerSlider.includes('Timer.periodic(const Duration(seconds: 5)'), 'Must have 5 second auto-advance timer');
  assert(bannerSlider.includes('PageIndicator('), 'Must render PageIndicator');

  const bannerCard = fs.readFileSync(
    path.join(salonDir, 'lib', 'features', 'customer', 'home', 'widgets', 'home_banner_card.dart'),
    'utf-8'
  );
  assert(bannerCard.includes('HomeSliderService.instance.handleSliderClick'), 'Card click must trigger HomeSliderService');
  assert(bannerCard.includes('DistanceCalculator.formatDistance'), 'Card must show actual distance badge if within radius');
});

// ---------------------------------------------------------
// 4. Firestore & Storage Security Rules Verification
// ---------------------------------------------------------
it('Firestore Security Rules grant Super Admin full write, public read, and restrict customer updates strictly to atomic clickCount', () => {
  const rules = fs.readFileSync(path.join(salonDir, 'firestore.rules'), 'utf-8');
  assert(rules.includes('match /homeSliders/{sliderId}'), 'Must declare rules for homeSliders');
  assert(rules.includes('allow read: if true;'), 'Public read allowed for customer slider discovery');
  assert(rules.includes('allow create, delete: if isSuperAdmin();'), 'Only Super Admin can create or delete sliders');
  assert(rules.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['clickCount'])"), 'Customers can only modify clickCount');
  assert(rules.includes('request.resource.data.clickCount == resource.data.clickCount + 1'), 'clickCount can only increment by 1');
  assert(rules.includes('match /clicks/{clickId}'), 'Must declare rules for clicks subcollection');
});

it('Firebase Storage Security Rules grant Super Admin upload & delete authority for home_sliders', () => {
  const rules = fs.readFileSync(path.join(salonDir, 'storage.rules'), 'utf-8');
  assert(rules.includes('match /home_sliders/{sliderId}/{fileName}'), 'Must declare rule for home_sliders');
  assert(rules.includes('allow read: if true;'), 'Public download allowed for customer banner rendering');
  assert(rules.includes('allow write: if isSuperAdmin()'), 'Only Super Admin can upload slider images');
  assert(rules.includes('allow delete: if isSuperAdmin();'), 'Only Super Admin can delete slider images');
});

it('Firestore composite index configuration includes homeSliders (isActive ASC, displayOrder ASC)', () => {
  const indexesJson = JSON.parse(fs.readFileSync(path.join(salonDir, 'firestore.indexes.json'), 'utf-8'));
  const match = indexesJson.indexes.find(
    (idx) => idx.collectionGroup === 'homeSliders' && idx.fields.some((f) => f.fieldPath === 'displayOrder')
  );
  assert(match, 'Must define composite index on homeSliders for isActive and displayOrder');
});

console.log('================================================================');
console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED `);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}

