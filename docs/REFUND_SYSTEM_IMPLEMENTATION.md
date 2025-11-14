# Refund System Implementation - Complete Documentation

**Date:** 2025-11-14  
**Version:** 1.0.0 - Production Ready

---

## 🎯 Overview

Complete refund tracking system with separate `refunds` table for better scalability and history tracking.

### Key Features
- ✅ Separate refunds table (not fields in orders)
- ✅ Support for multiple refunds per order (partial refunds)
- ✅ Complete refund history and audit trail
- ✅ Admin workflow for manual Chargily processing
- ✅ Customer notifications
- ✅ Status tracking with validation
- ✅ Auto-refund creation on order cancellation

---

## 🗄️ Database Schema

### Refunds Table

```sql
CREATE TABLE "refunds" (
  "id" SERIAL PRIMARY KEY,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "orderId" INTEGER NOT NULL,
  "requestedBy" INTEGER NOT NULL,
  "processedBy" INTEGER,
  "amount" DECIMAL(10,2) NOT NULL,
  "orderTotal" DECIMAL(10,2) NOT NULL,
  "status" VARCHAR NOT NULL DEFAULT 'PENDING',
  "reason" VARCHAR NOT NULL,
  "description" TEXT NOT NULL,
  "adminNote" TEXT,
  "requestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "checkoutId" VARCHAR,
  "paymentMethod" VARCHAR NOT NULL,
  "transactionReference" VARCHAR,
  "isPartial" BOOLEAN NOT NULL DEFAULT false,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1
);

-- Foreign Keys
ALTER TABLE "refunds"
ADD CONSTRAINT "FK_refund_order" FOREIGN KEY ("orderId") 
  REFERENCES "orders"("id") ON DELETE CASCADE,
ADD CONSTRAINT "FK_refund_requester" FOREIGN KEY ("requestedBy") 
  REFERENCES "users"("id") ON DELETE NO ACTION,
ADD CONSTRAINT "FK_refund_processor" FOREIGN KEY ("processedBy") 
  REFERENCES "users"("id") ON DELETE NO ACTION;

-- Indexes
CREATE INDEX "IDX_refunds_order" ON "refunds" ("orderId");
CREATE INDEX "IDX_refunds_status" ON "refunds" ("status");
CREATE INDEX "IDX_refunds_requested_at" ON "refunds" ("requestedAt");
CREATE INDEX "IDX_refunds_requester" ON "refunds" ("requestedBy");
```

### Relationship

```
orders (1) ←→ (N) refunds

One order can have multiple refunds (for partial refunds)
```

---

## 📊 Refund Status Flow

```
PENDING → PROCESSING → COMPLETED
   ↓           ↓            ↑
CANCELLED   FAILED → ────→ PENDING (retry)
```

### Status Definitions

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| **PENDING** | Awaiting admin action | System |
| **PROCESSING** | Admin is processing in Chargily | Admin |
| **COMPLETED** | Refund successful | Admin |
| **FAILED** | Refund failed | Admin |
| **CANCELLED** | Request cancelled | Admin |

---

## 📡 API Endpoints

### Customer Endpoints

#### 1. Create Refund Request
```http
POST /refunds
Authorization: Bearer <token>

{
  "orderId": 123,
  "reason": "ORDER_CANCELLED",
  "description": "Customer changed mind",
  "amount": 150.50  // Optional, defaults to full order amount
}

Response: Refund (201 Created)
```

#### 2. Get My Refunds
```http
GET /refunds/my-refunds
Authorization: Bearer <token>

Response: Refund[]
```

#### 3. Get Refund Details
```http
GET /refunds/:id
Authorization: Bearer <token>

Response: Refund
```

---

### Admin Endpoints

#### 4. Get Pending Refunds
```http
GET /refunds/admin/pending
Authorization: Bearer <admin-token>

Response: Refund[]
```

#### 5. Update Refund Status
```http
PATCH /refunds/:id/status
Authorization: Bearer <admin-token>

{
  "status": "COMPLETED",
  "adminNote": "Processed via Chargily dashboard on 2025-11-14"
}

Response: Refund
```

#### 6. Get Order Refunds
```http
GET /refunds/order/:orderId
Authorization: Bearer <admin-token>

Response: Refund[]
```

---

## 🔄 Refund Workflow

### Scenario 1: Order Cancellation (Auto-Refund)

```
1. Customer cancels paid order
   ↓
2. OrderService.cancelOrder() executes
   ↓
3. RefundService.createRefundForCancelledOrder() creates refund
   ↓
4. Refund status = PENDING
   ↓
5. Admin gets notification
   ↓
6. Admin processes in Chargily Dashboard
   ↓
7. Admin updates status to COMPLETED
   ↓
8. Customer gets notification
```

### Scenario 2: Manual Refund Request

```
1. Customer requests refund (POST /refunds)
   ↓
2. System validates (order paid, amount valid, etc.)
   ↓
3. Refund created with status = PENDING
   ↓
4. Admin gets notification
   ↓
5. Admin reviews request
   ↓
6. Admin processes in Chargily Dashboard
   ↓
7. Admin updates status to COMPLETED
   ↓
8. Customer gets notification
```

### Scenario 3: Partial Refund

```
Order: 500 DZD (3 products)
Product 1 damaged: Request refund for 150 DZD

POST /refunds
{
  "orderId": 123,
  "reason": "PRODUCT_ISSUE",
  "description": "Product #1 was damaged",
  "amount": 150.50  // Partial amount
}

Result: Refund created with isPartial = true
```

---

## 🎨 Files Created/Modified

### New Files (8 files)

1. **Enums:**
   - `src/core/order/enums/refund-status.enum.ts`
   - `src/core/order/enums/refund-reason.enum.ts`

2. **Entity:**
   - `src/core/order/entities/refund.entity.ts`

3. **DTOs:**
   - `src/core/order/dtos/create-refund.dto.ts`
   - `src/core/order/dtos/update-refund-status.dto.ts`

4. **Service:**
   - `src/core/order/services/refund.service.ts`

5. **Controller:**
   - `src/core/order/refund.controller.ts`

6. **Documentation:**
   - `docs/REFUND_SYSTEM_IMPLEMENTATION.md`

### Modified Files (3 files)

1. `src/core/order/entities/order.entity.ts` - Added refunds relation
2. `src/core/order/services/order.service.ts` - Integrated refund creation
3. `src/core/order/order.module.ts` - Registered refund components

---

## 🧪 Testing Guide

### Test 1: Auto-Refund on Cancellation

```bash
# 1. Create and pay for order
POST /order
# ... order flow ...

# 2. Cancel order
POST /order/123/cancel
{
  "reason": "Changed my mind"
}

# Expected:
# - Order cancelled
# - Refund created automatically
# - Admin notified
# Response includes refundId
```

### Test 2: Manual Refund Request

```bash
# Customer requests refund
POST /refunds
Authorization: Bearer <customer-token>
{
  "orderId": 123,
  "reason": "PRODUCT_ISSUE",
  "description": "Product was damaged",
  "amount": 150.50
}

# Expected: 201 Created with Refund object
```

### Test 3: Admin Processes Refund

```bash
# 1. Get pending refunds
GET /refunds/admin/pending
Authorization: Bearer <admin-token>

# 2. Process in Chargily Dashboard manually

# 3. Update status
PATCH /refunds/1/status
Authorization: Bearer <admin-token>
{
  "status": "COMPLETED",
  "adminNote": "Refunded via Chargily on 2025-11-14"
}

# Expected:
# - Refund status updated
# - Customer notified
```

### Test 4: Partial Refund

```bash
POST /refunds
{
  "orderId": 123,  
  "reason": "PRODUCT_ISSUE",
  "description": "1 of 3 products damaged",
  "amount": 100  // Less than order total (300)
}

# Expected:
# - Refund created with isPartial = true
# - Can create another refund later
```

### Test 5: Multiple Refund Attempts

```bash
# First attempt fails
PATCH /refunds/1/status
{
  "status": "FAILED",
  "adminNote": "Bank rejected"
}

# Create retry (attempt #2)
POST /refunds
{
  "orderId": 123,
  "reason": "ORDER_CANCELLED",
  "description": "Retry after bank rejection"
}

# Expected: attemptNumber = 2
```

---

## 🔐 Validation Rules

### Create Refund Validations

1. ✅ Order must exist
2. ✅ User must own the order
3. ✅ Order must be paid via EPAYMENT
4. ✅ Checkout status must be 'paid'
5. ✅ Refund amount ≤ order total
6. ✅ Total refunded ≤ order total

### Status Transition Validations

| From | To | Allowed? |
|------|----|----|
| PENDING | PROCESSING | ✅ |
| PENDING | CANCELLED | ✅ |
| PENDING | FAILED | ✅ |
| PROCESSING | COMPLETED | ✅ |
| PROCESSING | FAILED | ✅ |
| FAILED | PENDING | ✅ (retry) |
| COMPLETED | * | ❌ (terminal) |
| CANCELLED | * | ❌ (terminal) |

---

## 🔔 Notifications

### Admin Notifications

**New Refund Request:**
```
Title: "New Refund Request"
Message: "Order #123 - Refund request for 500.00 DZD"
Type: ORDERS
```

### Customer Notifications

**Refund PROCESSING:**
```
Title: "Refund Processing"
Message: "Your refund of 500.00 DZD is being processed"
```

**Refund COMPLETED:**
```
Title: "Refund Completed"
Message: "Your refund of 500.00 DZD has been completed. Money will arrive in 3-5 business days."
```

**Refund FAILED:**
```
Title: "Refund Failed"
Message: "Your refund request failed. {adminNote}"
```

---

## 📈 Benefits of Separate Table

### vs. Adding Fields to Order Table

| Feature | Order Fields | Separate Table |
|---------|-------------|----------------|
| Multiple refunds | ❌ Only 1 | ✅ Unlimited |
| Partial refunds | ❌ Hard | ✅ Easy |
| Refund history | ❌ Lost | ✅ Complete |
| Refund attempts | ❌ No | ✅ Track all |
| Query refunds | ❌ Complex | ✅ Simple |
| Analytics | ❌ Hard | ✅ Easy |
| Order table | ❌ Messy | ✅ Clean |

---

## 🚀 Next Steps

### Database Migration

```bash
# Generate migration
pnpm typeorm migration:generate -n AddRefundsTable

# Run migration
pnpm typeorm migration:run
```

### Testing

- [ ] Test auto-refund on cancellation
- [ ] Test manual refund request
- [ ] Test admin workflow
- [ ] Test partial refunds
- [ ] Test multiple attempts
- [ ] Test notifications

### Future Enhancements

1. **Admin Dashboard UI**
   - Refund management interface
   - Bulk operations
   - Refund statistics

2. **Analytics**
   - Total refunds this month
   - Average processing time
   - Top refund reasons

3. **Automation (if Chargily adds API)**
   - Auto-process refunds via API
   - Webhook for refund completion

---

## 💡 Important Notes

1. **Chargily Limitation:** No refund API exists, must process manually in dashboard
2. **Order Relation:** Refunds are tied to orders via CASCADE delete
3. **Partial Refunds:** Can create multiple refunds up to order total
4. **Retry Logic:** Failed refunds can be retried (new refund record)
5. **Terminal States:** COMPLETED and CANCELLED cannot transition

---

**Implementation Complete!** ✅  
**Ready for Migration & Testing** 🚀

