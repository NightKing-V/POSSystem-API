# POS System: Backend Development Plan (NestJS)

**Overview:** A 14-week programme, divided into 5 phases, and structured module-by-module with proper dependency ordering.

## Phase 1: Foundation & Auth (Weeks 1–2)
- [x] **Project Setup (Week 1):** Initialise the NestJS scaffold, configure database migrations, set up JWT configuration, and establish the environment setup.
- [x] **Login & Auth (Weeks 1–2):** Build the Auth module to handle logins, refresh tokens, and logouts; implement password hashing; and manage role/permission seeding.
- [x] **Org & User Management (Week 2):** Develop User and Organisation CRUD operations, create roles & permissions APIs, manage user_roles assignment, and seed business categories.

## Phase 2: Locations, Products & Pricing (Weeks 3–5)
- [x] **Inventory Locations (Week 3):** Implement inventory_locations CRUD (covering branches, warehouses, and docks), and build the user_locations assignment API.
- [x] **Product Catalogue (Weeks 3–4):** Set up the productcategory as a self-referencing tree, manage brands and products CRUD, and implement barcode/SKU generation.
- [x] **Product Pricing (Week 4):** Develop product_prices CRUD, enforce effectivefrom/to logic, and implement isdefault enforcement.
- [x] **Suppliers (Week 5):** Create Suppliers CRUD and properly link products to their respective suppliers.

## Phase 3: Inventory & Purchase Orders (Weeks 6–8)
- [ ] **Purchase Orders (Week 6):** Build purchase_orders and items CRUD, design the PO status state machine (draft → sent → partial → received), and generate PO numbers.
- [ ] **Stock Batches & Receiving (Weeks 6–7):** Implement stock_batches CRUD, handle the receive-from-PO flow, and trigger inventory_stock creation upon receiving.
- [ ] **Inventory Transactions (Weeks 7–8):** Manage inventory_transactions (received, transfer, sale, adjustment), handle transfers between locations, and configure reorder alerts.
- [ ] **Supplier Credit Accounts (Week 8):** Develop supplier_credit_accounts CRUD and manage credit_transactions (invoiced, payment, credit note).

## Phase 4: Customers, Discounts & POS Billing (Weeks 9–11)
- [ ] **Customers (Week 9):** Implement customers CRUD, incorporate soft delete functionality, and manage customer type logic.
- [ ] **Discounts (Weeks 9–10):** Build Discounts CRUD, handle product_discounts and category_discounts, implement stackable/scope logic, and establish coupon validation.
- [ ] **POS Billing (Weeks 10–11):** Develop bills, bill_items, and bill_payments APIs; build the discount application engine; handle inventory deduction upon sale; and implement reliable bill number generation.

## Phase 5: Loyalty, Customer Credit & Reporting (Weeks 12–14)
- [ ] **Loyalty Programme (Week 12):** Create loyalty_program_config CRUD, manage point earning and redemption on bills, handle customer_loyalty_transactions, and schedule the expiry job.
- [ ] **Customer Credit Accounts (Weeks 12–13):** Build customer_credit_accounts CRUD, manage credit_transactions (charged, repaid, credit note), and strictly enforce balance limits.
- [ ] **Reporting & Dashboards (Weeks 13–14):** Write aggregate queries for sales (by period, location, cashier), stock valuation, top performing products, and supplier payables.

## Buffer & Deployment (Week 14)
- [ ] **Final Review:** Week 14 includes a dedicated buffer period for integration testing, edge-case fixes, performance reviews, and deployment preparation.