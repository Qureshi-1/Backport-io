# Backport Admin Panel — Worklog

## 2025-07-11 — Backend Admin Enhancements (admin-panel-v2)

### Task 1: POST /health endpoint (`backend/main.py`)
- Added `POST /health` route immediately after the existing `GET /health` endpoint.
- Returns the exact same response structure: status, version, gateway, uptime, and system checks (database, cache).
- Placed before the `@app.get("/")` root route.

### Task 2: plan_upgrade audit tracking (`backend/payment.py`)
- Enhanced the payment verification flow (`/verify`) to detect plan upgrades vs new purchases.
- Captured `previous_plan = user.plan` **before** the plan update to correctly distinguish upgrade from first purchase.
- When `previous_plan != "free"`, the audit log uses `event_type="plan_upgrade"` instead of `"plan_purchase"`.
- Upgrade audit logs include a `previous_plan` field in `details` for traceability.

### Task 3: Revenue endpoint enhancement (`backend/admin.py`)
- Updated `get_revenue()` to include `plan_upgrade` events alongside `plan_purchase` in revenue calculations.
- Changed all 3 occurrences of `AuditLog.event_type == "plan_purchase"` to `AuditLog.event_type.in_(["plan_purchase", "plan_upgrade"])`:
  1. Current month revenue calculation
  2. Last month revenue calculation
  3. Daily revenue (last 30 days) calculation

### Files Modified
- `backend/main.py` — added POST /health
- `backend/payment.py` — added plan_upgrade audit log logic
- `backend/admin.py` — expanded revenue queries to include plan_upgrade events
