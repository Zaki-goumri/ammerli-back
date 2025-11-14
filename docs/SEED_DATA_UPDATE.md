# Seed Data Update - Complete Documentation

**Date:** 2025-11-14  
**Version:** 2.0.0 - Schema Aligned

---

## 🎯 Overview

Updated seed scripts to match current database schema including:
- Refunds table support
- Order cancellation fields
- Checkout schema updates (isPaid instead of status)
- Enhanced seed data with more realistic Algerian products

---

## 📊 Schema Changes Reflected

### 1. Refunds Table
- Added `refunds` to TRUNCATE statement
- Ready for refund system testing

### 2. Order Entity Updates
- ✅ `isCancelled` (boolean)
- ✅ `cancellationReason` (text, nullable)
- ✅ `cancelledBy` (string, nullable)
- ✅ `cancelledAt` (timestamp, nullable)
- ✅ `refunds` relation (OneToMany)

### 3. Checkout Entity Updates
- ✅ `isPaid` (boolean) - instead of status enum
- ✅ `signature` (string, unique, nullable)
- ✅ Payment way properly typed (CIB/EDAHABIA)

### 4. Product Entity
- ✅ `specification` (text array)
- ✅ `expirationDate` (date)
- ✅ `quantityPerBatch` (integer)

---

## ��️ Updated Seed Data

### Users (4 total)
```typescript
1. Admin User
   - Phone: 0551234567
   - Role: ADMIN
   - Name: Admin Dashboard

2. Ahmed Benali
   - Phone: 0557654321
   - Role: WHOLESELLER
   - Market: Benali Wholesale Distribution

3. Fatima Khelifi
   - Phone: 0551122334
   - Role: SUPERMARKET
   - Market: El Baraka Supermarket

4. Mohamed Amara
   - Phone: 0559876543
   - Role: SUPERMARKET
   - Market: Supermarket El Hayat
```

### Addresses (4 total)
- Algiers - Bab El Oued
- Oran - Sidi El Houari
- Constantine - El Kantara
- Algiers - Hussein Dey

### Brands (6 total)
- Coca-Cola
- Pepsi
- Ifri
- Hamoud Boualem
- Lay's
- Bimo

### Categories (4 total)
- Beverages
- Snacks
- Dairy
- Bakery

### Products (6 total)

| Product | Brand | Category | Price | Qty | Batch | Expiration |
|---------|-------|----------|-------|-----|-------|------------|
| Coca-Cola 1L | Coca-Cola | Beverages | 150 DZD | 100 | 10 | 2025-12-31 |
| Ifri Gazouz 1L | Ifri | Beverages | 125 DZD | 150 | 15 | 2025-11-30 |
| Hamoud Selecto 1.5L | Hamoud Boualem | Beverages | 135 DZD | 120 | 12 | 2025-10-31 |
| Lay's Classic Chips 150g | Lay's | Snacks | 75 DZD | 200 | 20 | 2025-06-30 |
| Bimo Cookies 200g | Bimo | Snacks | 95 DZD | 180 | 18 | 2025-08-15 |
| Pepsi Cola 1.5L | Pepsi | Beverages | 145 DZD | 90 | 9 | 2026-01-31 |

### Orders (4 total)

**Order 1: E-PAYMENT** (PAID)
- Buyer: Fatima Khelifi (Supermarket)
- Items:
  - Coca-Cola 1L × 2 = 300 DZD
  - Lay's Classic Chips × 3 = 225 DZD
- **Total: 525 DZD**
- Payment: CIB
- Status: DELIVERED

**Order 2: CASH** (NOT PAID)
- Buyer: Mohamed Amara (Supermarket)
- Items:
  - Ifri Gazouz 1L × 5 = 625 DZD
  - Bimo Cookies × 2 = 190 DZD
- **Total: 815 DZD**
- Payment: CASH
- Status: CONFIRMATION

**Order 3: E-PAYMENT** (PAID)
- Buyer: Fatima Khelifi (Supermarket)
- Items:
  - Hamoud Selecto 1.5L × 4 = 540 DZD
  - Pepsi Cola 1.5L × 2 = 290 DZD
- **Total: 830 DZD**
- Payment: CIB
- Status: DELIVERED

**Order 4: CASH** (NOT PAID)
- Buyer: Mohamed Amara (Supermarket)
- Items:
  - Coca-Cola 1L × 10 = 1500 DZD
- **Total: 1500 DZD**
- Payment: CASH
- Status: CONFIRMATION

---

## 🔧 Code Changes

### Files Modified (3 files)

#### 1. `src/seed/seed.service.ts`
```diff
+ Import PAYMENT_WAY instead of PaymentWay
+ Updated TRUNCATE to include: refunds, invoices, fav_products, notifications, tokens
+ Fixed checkout creation to use isPaid
+ Fixed payment way to use PAYMENT_WAY enum correctly
```

#### 2. `src/seed/seeds-data.ts`
```diff
+ Added 1 more user (4 total)
+ Added 1 more address (4 total)
+ Added 3 more brands (6 total)
+ Added 1 more category (4 total)
+ Added 3 more products (6 total)
+ Enhanced product descriptions
+ Added 2 more orders (4 total)
+ More realistic Algerian product names
```

#### 3. `src/core/order/services/refund.service.ts`
```diff
+ Fixed checkout validation: isPaid instead of status === 'paid'
```

---

## 🚀 Usage

### Run Seeds

```bash
# Inside Docker container
docker exec -it server /bin/sh
pnpm seed

# Or from host
docker exec -it server pnpm seed
```

### Seed Output

```
Starting database seeding...
Clearing existing data...
Database cleared successfully!
Seeding users...
Created 4 users
Seeding addresses...
Created 4 addresses
Seeding brands...
Created 6 brands
Seeding categories...
Created 4 categories
Seeding products...
Created 6 products
Seeding orders...
Created 4 orders with related data
Database seeding completed successfully!
```

---

## 🧪 Testing Scenarios

### Scenario 1: Test Order Cancellation

```bash
# 1. Run seeds
pnpm seed

# 2. Cancel Order #1 (PAID order)
POST /order/1/cancel
Authorization: Bearer <supermarket-token>
{
  "reason": "Changed my mind"
}

# Expected:
# - Order cancelled
# - Refund created (status: PENDING)
# - Admin notified
# - Inventory restored
```

### Scenario 2: Test Refund Flow

```bash
# 1. Get pending refunds (Admin)
GET /refunds/admin/pending
Authorization: Bearer <admin-token>

# Expected: Refund from cancelled order

# 2. Update refund status
PATCH /refunds/1/status
Authorization: Bearer <admin-token>
{
  "status": "COMPLETED",
  "adminNote": "Refunded via Chargily"
}

# Expected:
# - Refund completed
# - Customer notified
```

### Scenario 3: Test Product Expiration

```bash
# Products with expiration dates:
# - Lay's Chips: 2025-06-30 (earliest)
# - Bimo Cookies: 2025-08-15
# - Hamoud Selecto: 2025-10-31
# - Ifri Gazouz: 2025-11-30
# - Coca-Cola: 2025-12-31
# - Pepsi: 2026-01-31 (latest)

# System should notify wholesaler about expiring products
```

---

## 📊 Database State After Seeding

### Tables Populated

| Table | Count | Notes |
|-------|-------|-------|
| users | 4 | 1 Admin, 1 Wholeseller, 2 Supermarkets |
| addresses | 4 | Distributed across users |
| brands | 6 | Algerian + International brands |
| categories | 4 | Beverages, Snacks, Dairy, Bakery |
| products | 6 | All owned by wholeseller |
| product_pictures | 6 | 1 main picture per product |
| orders | 4 | 2 paid (EPAYMENT), 2 unpaid (CASH) |
| order_products | 8 | Items in orders |
| checkouts | 4 | 2 with isPaid=true |
| trackings | 4 | 2 DELIVERED, 2 CONFIRMATION |
| refunds | 0 | Ready for testing |
| invoices | 0 | Ready for testing |

---

## 💡 Key Points

1. **Realistic Data**: Uses actual Algerian brands and products
2. **Schema Aligned**: Matches all current entity definitions
3. **Test Ready**: Covers all major flows
4. **Clean Slate**: TRUNCATE clears all tables safely
5. **Cascades**: Foreign key cascades handled properly

---

## 🔄 Migration Path

If you had old seeds running:

```bash
# 1. Clear old data
pnpm seed  # Will auto-clear via TRUNCATE

# 2. New data will be seeded
# No manual cleanup needed!
```

---

## ✅ Checklist

- [x] Updated TRUNCATE to include all tables
- [x] Fixed Checkout schema (isPaid not status)
- [x] Added more realistic seed data
- [x] Added proper enum imports
- [x] Aligned with Order cancellation fields
- [x] Ready for Refund system testing
- [x] Enhanced product specifications
- [x] Added expiration dates
- [x] More users and addresses
- [x] Documentation updated

---

**Seeds Updated & Ready!** 🎉  
**Run `pnpm seed` to test!** 🚀

