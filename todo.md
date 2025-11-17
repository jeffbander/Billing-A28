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
