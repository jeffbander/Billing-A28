# Provider Reimbursement Modeling Tool - TODO

## Database Schema
- [x] Create CPT codes table
- [x] Create payers table
- [x] Create plans table
- [x] Create rates master table
- [x] Create payer multipliers table
- [x] Create scenarios table
- [x] Create scenario details table

## Backend API
- [x] Implement CPT code CRUD operations
- [x] Implement payer CRUD operations
- [x] Implement plan CRUD operations
- [x] Implement rate management (create, read, update, delete)
- [x] Implement payer multiplier management
- [x] Implement scenario creation and management
- [x] Implement reimbursement calculation logic
- [x] Implement comparison logic (Article 28 vs FPA)
- [x] Implement data seeding with default multipliers and sample data

## Frontend UI
- [x] Design color scheme and theme
- [x] Create dashboard layout with navigation
- [x] Create rates management page
- [x] Create payer/plan management page
- [x] Create scenario builder page
- [x] Create scenario results visualization page
- [x] Implement data tables with filtering and sorting
- [x] Implement charts for revenue comparison
- [x] Implement admin panel for data management
- [x] Add color coding for verified vs assumed data

## Features
- [x] Rate hierarchy logic (plan → payer → type → default)
- [x] Scenario builder with payer mix inputs
- [x] Scenario builder with procedure mix inputs
- [x] Revenue calculation engine
- [x] Comparative analysis ($ and % difference)
- [ ] Export functionality (CSV/PDF)
- [ ] Data import from CSV/Excel

## Testing & Deployment
- [x] Test all CRUD operations
- [x] Test calculation accuracy
- [x] Test scenario builder workflow
- [x] Create checkpoint for deployment

## Bug Fixes
- [x] Fix React setState error in Home page navigation
- [x] Fix scenario creation insertId error (NaN in scenario_details)
- [x] Fix calculation logic to use global rates for FPA and technical+professional for Article 28
- [x] Add Professional and Technical component breakdown to Article 28 results display
- [x] Update Revenue Comparison chart to show Article 28 components in different colors (stacked bar)
- [x] Add edit functionality to Rates Management page
- [x] Add edit functionality to Multipliers page
- [x] Add CSV bulk import feature for rates
- [x] Update rates with new compensation values from user's image
- [x] Remove Basic Information section from scenario results
- [x] Add CPT code revenue breakdown summary
- [x] Reorganize Article 28 Total display with Professional/Technical breakdown
- [x] Rename "Provider Name" to "Scenario Name" in scenario builder
- [x] Combine CPT code breakdown with visual comparison bars
- [x] Make Article 28 Professional/Technical split values larger and more prominent
- [x] Remove Total Patients field from scenario builder
- [x] Remove Site Type field from scenario builder
- [x] Update Multipliers page to clearly show insurance types (Medicare, Commercial, Medicaid) for Global/FPA and A28 components
- [x] Update rates table schema to add payerType column (Medicare, Commercial, Medicaid)
- [x] Migrate existing rates to new structure with 9 rates per CPT code
- [x] Remove multipliers table and all multiplier logic from calculations
- [x] Update calculation logic to use direct rates instead of base rate × multiplier
- [x] Update Rates Management UI to show 9 rates per CPT code grouped by payer type
- [x] Remove Multipliers page from navigation
- [x] Update CSV import/export to handle new rate structure
- [x] Verify Commercial and Medicaid rates are editable in Rates Management page
- [x] Fix issue: Commercial and Medicaid rates not editable in UI
- [x] Fix missing pencil icons for Commercial and Medicaid rates
- [ ] Debug why Commercial and Medicaid rates still not showing pencil icons in Manage Rates
- [x] Create simple, clear interface for editing Commercial and Medicaid rates
- [x] Replace "Not set" rates with $0.00 display
- [x] Create placeholder rate records ($0.00) for all missing rates to make them editable
- [x] Fix rate save functionality for Commercial and Medicaid rates
- [x] Add ability to add new CPT codes in Manage Rates
- [x] Add ability to delete CPT codes in Manage Rates
- [x] Update rates for CPT codes from user's new rate table (93306, 99213, 99214, 99203, 99204, 99205, 78452, 93351)
- [x] Update site logo to Mount Sinai Fuster Heart Hospital logo
- [x] Bypass authentication to allow public access without login
- [x] Add Mount Sinai logo to mobile header next to sidebar trigger

## Role-Based System Implementation
- [x] Update user schema to ensure role field supports admin/user/guest
- [x] Create session storage system for user/guest temporary data
- [x] Implement admin data persistence to main database
- [x] Create Admin Management Panel UI for role management
- [x] Add role management API endpoints (set-role)
- [x] Update rate editing to distinguish admin vs user/guest edits
- [x] Implement session data loading on login (load admin dataset)
- [x] Create guest session management utility
- [x] Add "Continue as Guest" button to login page
- [x] Create subtle "Guest Mode Active" badge in header (no warnings)
- [x] Update backend context to handle guest sessions
- [x] Hide Admin Panel from guest users in navigation
- [x] Bootstrap admin role for jeffrey_bander@post.harvard.edu
- [ ] Test admin edits persist globally
- [ ] Test user/guest edits are session-only
- [ ] Test role promotion/demotion functionality
- [x] Update Scenario Builder to pull CPT codes from Reimbursement Rates instead of CPT codes table
- [x] Fix guest mode button on home page to properly start guest session
- [x] Add guest mode option to OAuth sign-in page
- [x] Test guest mode works from both entry points
- [x] Fix rates query to show database rates to guest users
- [x] Enable rate editing for guests (session-only storage)
- [x] Fix CPT codes visibility in Scenario Builder for guests
- [x] Test full guest workflow (view rates, edit rates, create scenarios)

## Calculated Rates Feature
- [x] Create calculation_settings table for storing multipliers
- [x] Add backend API for getting/updating calculation settings
- [x] Add Calculation Settings section to Admin Panel UI
- [x] Add Commercial Technical multiplier input (0.5x - 3.0x)
- [x] Add Medicaid Technical multiplier input (0.5x - 3.0x)
- [x] Add "Rate Mode" toggle to Scenario Builder (Manual vs Calculated)
- [x] Update scenario schema to store rateMode field
- [x] Update calculation logic to apply multipliers when rateMode is "calculated"
- [x] Test calculated rates with various multiplier values
- [x] Verify manual rates still work unchanged

## Provider-Centric Modeling System
- [x] Create institutions table for home institution tracking
- [x] Create providers table (name, type, home institution)
- [x] Add work_rvu column to cpt_codes table
- [x] Add procedure_type column to cpt_codes table (imaging/procedure/visit)
- [x] Create scenario_provider_activities table for tracking orders/reads/performs
- [x] Build backend API for institutions CRUD
- [x] Build backend API for providers CRUD
- [x] Create Institutions management page in Admin Panel
- [x] Create Providers management page in Admin Panel
- [ ] Update CPT Codes form to include RVU and procedure type
- [ ] Enhance Scenario Builder to add providers to scenarios
- [ ] Add activity entry UI (ordered/read for imaging, performed for others)
- [ ] Add validation: sum(ordered) = sum(read) per imaging CPT code
- [ ] Update calculation engine for provider attribution
- [ ] Track professional $ by home institution
- [ ] Track RVUs by provider
- [ ] Track technical $ to Mount Sinai West
- [ ] Build provider-centric results view
- [ ] Build institution-centric results view
- [ ] Test Type 1, Type 2, and Type 3 provider scenarios

## Valuation Scenario Feature
- [x] Add Work RVU field to CPT Codes management UI
- [x] Add Procedure Type selector to CPT Codes management UI (Imaging/Procedure/Visit)
- [x] Populate Work RVU data for existing 9 CPT codes
- [x] Create valuations table for storing valuation scenarios
- [x] Create valuation_activities table for CPT code activities (orders/reads/performs)
- [x] Add backend API for valuation CRUD operations
- [x] Add valuation calculation endpoint
- [x] Create Valuation Scenario Builder page
- [x] Add provider selection to Valuation Builder
- [x] Add CPT code activity inputs (orders/reads for imaging, performs for others)
- [x] Implement valuation calculation engine with provider attribution logic
- [x] Calculate RVUs by provider
- [x] Calculate professional revenue by provider type
- [x] Calculate technical revenue to Mount Sinai West
- [x] Create Valuation Results display page
- [x] Show RVU breakdown by CPT code
- [x] Show revenue attribution (professional $ destination, technical $ to facility)
- [x] Add navigation to Valuation scenarios from dashboard
- [x] Test Type 1 provider valuation end-to-end
- [x] Create comprehensive vitest test suite for valuations (19 tests passing)

## Valuation List and Comparison Features
- [ ] Create Valuation List/History page showing all saved valuations
- [ ] Add filtering by provider, date range, and search by name
- [ ] Add sorting by date, provider name, RVUs, revenue
- [ ] Add quick actions (view, edit, delete, compare) for each valuation
- [ ] Create Valuation Comparison View for side-by-side analysis
- [ ] Allow selecting 2-4 valuations to compare
- [ ] Show comparison table with RVUs, revenue, and activity differences
- [ ] Add visual charts for RVU and revenue comparison
- [ ] Add navigation from dashboard to Valuation List
- [ ] Add "Compare" button on Valuation Results page
- [ ] Test complete workflow: create → list → compare → edit
- [ ] Create vitest tests for list and comparison features

## Valuation List Feature - Phase 2 Complete
- [x] Created getValuationsWithSummary database function with enriched data
- [x] Created ValuationList page component with table display
- [x] Added search functionality by name or provider
- [x] Added sorting by date, provider name, and RVUs
- [x] Added checkbox selection for multiple valuations
- [x] Added Compare button that appears when selections made
- [x] Added dropdown actions menu (View Details, Compare, Delete)
- [x] Added route /valuations to App.tsx
- [x] Updated Dashboard card with "Create New" and "View All" buttons
- [x] Tested navigation from list to results page
- [x] Tested selection tracking and Compare button

## Valuation Comparison Feature - Phase 3 Complete
- [x] Created ValuationComparison page component
- [x] Fixed React hooks error by using useQueries instead of mapping useQuery
- [x] Display summary cards for each valuation with key metrics
- [x] Added visual comparison chart (bar chart with RVUs and revenue in $K)
- [x] Calculate and display differences vs baseline (RVU %, Prof. Revenue %, Tech. Revenue %)
- [x] Show activity comparison table across valuations (CPT codes side-by-side)
- [x] Added route /valuations/compare to App.tsx
- [x] Tested navigation from list to comparison with query params
- [x] Tested comparison with 2 different providers (Dr. Bander vs Dr. Mehta)
- [x] Verified calculations: +3.5 RVUs (+7.8%), +$88K Prof. Revenue (+33.0%)

## Edit Valuation Feature
- [x] Create EditValuation page component (/valuations/:id/edit)
- [x] Pre-populate form with existing valuation data
- [x] Pre-populate CPT activities with existing quantities
- [x] Add getActivities backend endpoint for fetching activities
- [x] Extend update backend endpoint to support updating activities
- [x] Implement delete and re-create logic for activities
- [x] Add "Edit" button to valuation list dropdown menu
- [x] Add route for /valuations/:id/edit in App.tsx
- [x] Test edit workflow: list → edit → save → view results (changed 50 to 60 performs)
- [x] Verified calculations update correctly (58.20 RVUs, $426K revenue)
- [x] Create comprehensive vitest tests for edit functionality (14 tests passing)

## Valuation Duplication Feature
- [x] Add duplicateValuation function to db.ts
- [x] Add duplicate backend endpoint to valuations router
- [x] Add "Duplicate" button to valuation list dropdown menu
- [x] Test duplication creates exact copy with "Copy of" prefix and new ID
- [x] Verify duplicated activities are independent from original
- [x] Create comprehensive vitest tests for duplication (4 tests passing)

## Bulk Edit Valuations Feature
- [x] Create BulkEditValuations page component
- [x] Add bulkUpdate backend endpoint to valuations router
- [x] Implement UI for selecting CPT code changes to apply
- [x] Add "Bulk Edit" button that appears when multiple valuations selected
- [x] Implement apply changes across all selected valuations (delete old, create new)
- [x] Add confirmation dialog before bulk update
- [x] Add route /valuations/bulk-edit to App.tsx
- [x] Create comprehensive vitest tests for bulk edit (3 tests passing)
- [x] All 53 valuation tests passing (valuations: 19, edit: 14, list/comparison: 13, duplication/bulk: 7)

## Valuation Analytics Dashboard
- [x] Create getValuationAnalytics aggregation function in db.ts
- [x] Calculate total RVUs across all valuations
- [x] Calculate total professional and technical revenue
- [x] Calculate provider productivity metrics (RVUs per provider, revenue per provider, valuation count)
- [x] Calculate revenue trends over time (monthly breakdown)
- [x] Add analytics endpoint to valuations router
- [x] Create ValuationAnalytics page component with Recharts
- [x] Add summary cards (Total RVUs: 161.40, Total Revenue: $3.9M, Active Providers: 7, Avg RVUs: 16.14)
- [x] Add RVU trend chart (line chart showing RVUs over time)
- [x] Add revenue trend chart (stacked area chart for professional vs technical revenue)
- [x] Add provider productivity table (sorted by RVUs descending)
- [x] Add top CPT codes breakdown (horizontal bar chart of most used CPT codes)
- [x] Add route /valuations/analytics to App.tsx
- [x] Add "View Analytics" button to Dashboard Provider Valuations card
- [x] Test analytics calculations with multiple valuations (verified all metrics correct)
- [x] Create comprehensive vitest tests for analytics aggregation (9 tests passing)
- [x] All 62 valuation tests passing across 5 test files

## Revenue Attribution Model Refactor

### Database Schema Updates
- [x] Create sites table (id, name, siteType: FPA/Article28, institutionId)
- [x] Add siteId to providers table (primary site)
- [x] Add institutionId and siteId to valuations table (optional for backward compatibility)
- [ ] Update valuation_activities: split monthlyPerforms into monthlyOrders and monthlyReads
- [ ] Add payerMix JSON field to valuations (placeholder for future)
- [ ] Run database migration (pnpm db:push)

### Calculation Engine Updates
- [ ] Implement earned vs attributed revenue logic
- [ ] Earned Prof Revenue & RVUs → reader's home institution
- [ ] Attributed Prof Revenue & RVUs → ordering MD (tracking)
- [ ] Earned Tech Revenue → site (actual)
- [ ] Attributed Tech Revenue → ordering MD (tracking)
- [ ] Handle Article 28 sites (prof + tech split)
- [ ] Handle FPA sites (global rate)
- [ ] Use Medicare rates from rates table

### UI Updates - Valuation Creation
- [ ] Add institution selector
- [ ] Add site selector (filtered by institution)
- [ ] Update CPT activity inputs: separate Orders and Reads fields
- [ ] Update form validation for new fields

### UI Updates - Results Display
- [ ] Show earned vs attributed breakdown
- [ ] Display earned prof revenue & RVUs by provider home institution
- [ ] Display attributed prof revenue & RVUs by ordering MD
- [ ] Display earned tech revenue by site
- [ ] Display attributed tech revenue by ordering MD
- [ ] Update activity breakdown table with orders/reads columns

### Testing
- [ ] Test Type 1 MD scenario (own institution)
- [ ] Test Type 2 MD scenario (different institution)
- [ ] Test Type 3 MD scenario (orders only)
- [ ] Test Article 28 site calculations
- [ ] Test FPA site calculations
- [ ] Create comprehensive vitest tests for new logic
- [ ] Verify all revenue attribution flows correctly
