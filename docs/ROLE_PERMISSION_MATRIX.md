# LIFNEX — ROLE PERMISSION MATRIX

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Stage:** Phase 4 — Supabase Authentication & Role Management  
**Standard:** Role-Based Access Control (RBAC) + Row Level Security (RLS) Enforcement

---

## 1. System Role Hierarchy

Lifnex recognizes four distinct security roles:

1. **`patient`**: Public individual or attending family member requiring blood.
2. **`donor`**: Registered voluntary blood donor capable of responding to compatible local broadcasts.
3. **`hospital`**: Accredited healthcare center, trauma surgical unit, or licensed blood bank.
4. **`admin`**: Platform superuser responsible for credential audits, user moderation, and system telemetry.

```
       +-------------------------+
       |   ADMINISTRATOR (admin) |
       +------------+------------+
                    | (Reviews, monitors & audits)
       +------------v------------+
       | HOSPITAL / BLOOD BANK   | (Clinical verification)
       +------------+------------+
                    | (Coordinates broadcasts & cross-matches)
       +------------v------------+
       | PATIENT & DONOR ROLES   | (Public voluntary emergency participants)
       +-------------------------+
```

---

## 2. Granular Operations & Permission Matrix

| Feature / Resource Operation | Patient | Donor | Hospital / Bank | Administrator | Backend Guard Mechanism |
|---|:---:|:---:|:---:|:---:|---|
| **Public Self-Registration** |  Allowed |  Allowed | ❌ Restricted | ❌ Restricted | Enforced via `RegisterRequest` validator check |
| **Hospital Verification Requirement** | N/A | N/A |  Mandatory | N/A | `is_verified` flag verified in DB before write ops |
| **Admin Privilege Assignment** | ❌ Blocked | ❌ Blocked | ❌ Blocked |  Trusted Seed | RLS `WITH CHECK (role = OLD.role)` blocks escalation |
| **Create Emergency Blood Request** |  Allowed | ❌ Blocked |  Allowed |  Allowed | `@require_roles(['patient', 'hospital', 'admin'])` |
| **Cancel Own Blood Request** |  Allowed | ❌ Blocked |  Allowed |  Allowed | Creator check (`patient_id = auth.uid()`) |
| **View Open Public Requests** |  Allowed |  Allowed |  Allowed |  Allowed | Public read policy on `blood_requests` |
| **Accept / Decline Blood Request** | ❌ Blocked |  Allowed | ❌ Blocked | ❌ Blocked | `@require_roles(['donor'])` + unique constraint |
| **Toggle Donor Availability Switch** | ❌ Blocked |  Allowed | ❌ Blocked |  Admin Override | Donor ID match (`user_id = auth.uid()`) |
| **Verify Patient Requisition** | ❌ Blocked | ❌ Blocked |  Allowed |  Allowed | `@require_roles(['hospital', 'admin'])` |
| **Confirm Donation & Apply Cooldown**| ❌ Blocked | ❌ Blocked |  Allowed |  Allowed | `@require_roles(['hospital', 'admin'])` |
| **Update Blood Bank Inventory** | ❌ Blocked | ❌ Blocked |  Allowed |  Allowed | `@require_roles(['hospital'])` |
| **View Tamper-Evident Audit Logs** | ❌ Blocked | ❌ Blocked | ❌ Blocked |  Allowed | `@require_roles(['admin'])` + RLS `false` update/del |
| **Deactivate Suspended User Account**| ❌ Blocked | ❌ Blocked | ❌ Blocked |  Allowed | `@require_roles(['admin'])` |

---

## 3. Privilege Escalation Prevention Architecture

1. **Schema Check Constraints**: `CHECK (role IN ('patient', 'donor', 'hospital', 'admin'))`.
2. **Registration Guard**: Public API `POST /api/v1/auth/register` explicitly schema-validates `role` against `Literal['patient', 'donor']`. Any registration payload attempting `role: "admin"` or `role: "hospital"` fails with HTTP 400.
3. **Database RLS Immutability**:
   ```sql
   CREATE POLICY "Users can update own profile (excluding role)" ON public.users
       FOR UPDATE USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));
   ```
   Prevents clients from sending modified role values in profile mutations.
4. **Server-Side Token Verification**: Role permissions are checked from database claims on the backend, **never** trusting client-side localStorage flags.

