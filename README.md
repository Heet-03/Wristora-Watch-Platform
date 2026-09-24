# Wristora — Haute Horlogerie Dual-Frontend Architecture

Wristora is an enterprise-grade luxury horology e-commerce platform structured into **two independent frontend applications** sharing a centralized **Firebase** backend (Authentication, Firestore Database, and Cloud Storage).

---

## Architecture Overview

```
                          WRISTORA
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ↓                                 ↓
      wristora-user                    wristora-admin
  (Customer Storefront)            (Store Manager Portal)
            │                                 │
  http://localhost:5173             http://localhost:5174
  (Future: www.wristora.com)        (Future: admin.wristora.com)
            │                                 │
            └────────────────┬────────────────┘
                             │
                             ↓
                      Shared Firebase
                 (Project: wristora-8ab09)
                  ├── Authentication
                  ├── Firestore Database
                  └── Cloud Storage
```

---

## Applications

### 1. Wristora User Application (`wristora-user/`)
- **Port**: `http://localhost:5173`
- **Scope**: Exclusive customer-facing storefront, timepiece catalog, multi-angle dial lightbox, cart, coupon voucher system, multi-channel checkout, order history, collector profile, and customer care concierge hub.
- **Commands**:
  ```bash
  cd wristora-user
  npm run dev       # Starts storefront on http://localhost:5173
  npm run build     # Compiles production bundle
  npm run lint      # Runs code linter
  ```

### 2. Wristora Admin Application (`wristora-admin/`)
- **Port**: `http://localhost:5174`
- **Scope**: Exclusive administrative workspace, trailing 6-month revenue analytics, inventory & product catalog management (add, edit, stock status), category hierarchy, order fulfillment pipeline, user permissions, and review moderation.
- **Commands**:
  ```bash
  cd wristora-admin
  npm run dev       # Starts admin portal on http://localhost:5174
  npm run build     # Compiles production bundle
  npm run lint      # Runs code linter
  ```

---

## Administrative Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `wristora@gmail.com` | `Wristora@1234` | Full Storefront & Administrative Portal |
| **VIP Collector** | `collector@wristora.com` | `user123456` | Customer Storefront & Private Vault |

---

## Future Production Deployment

- **Customer Website**: `https://www.wristora.com` (deployed from `wristora-user/`)
- **Admin Portal**: `https://admin.wristora.com` (deployed from `wristora-admin/`)
- **Backend**: Both production applications connect seamlessly to the existing Firebase project.

