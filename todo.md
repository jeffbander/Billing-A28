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
