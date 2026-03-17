# Flow/API Contract Audit

Cap nhat: 2026-03-07

## 1) Admin Contract Matrix (FE -> BE)

| Module FE | FE Call | BE Route | Request Contract | Response Contract | Trang thai |
|---|---|---|---|---|---|
| Dashboard | `GET /dashboard/stats` | `GET /api/v1/admin/dashboard/stats` | none | `{ revenue,totalEnrollments,newUsers,activeCourses,*Trend }` | Fixed |
| Courses list | `GET /courses` | `GET /api/v1/admin/courses` | `page,pageSize<=50,q,status,sortBy,sortOrder` | paginated envelope | OK |
| Course detail | `GET /courses/:id` | `GET /api/v1/admin/courses/:id` | `id:ObjectId` | detail envelope | OK |
| Course create | `POST /courses` | `POST /api/v1/admin/courses` | `title,instructorId?,description?,price?,settings?` | created course | Fixed |
| Course update | `PATCH /courses/:id` | `PATCH /api/v1/admin/courses/:id` | strict body + `id:ObjectId` | updated course | Fixed |
| Learners list | `GET /learners` | `GET /api/v1/admin/learners` | `page,pageSize,q` | paginated envelope | OK |
| Users list | `GET /users` | `GET /api/v1/admin/users` | `page,pageSize,q,role?,isActive?` | paginated envelope | Fixed |
| Orders list | `GET /payments/orders` | `GET /api/v1/admin/payments/orders` | `page,pageSize<=50,q,status,from,to` | paginated envelope | OK |
| Order sync | `POST /payments/orders/:orderCode/sync` | same | `orderCode:number` | `{status,orderCode,updatedAt}` | OK |
| Certificates list | `GET /certificates` | `GET /api/v1/admin/certificates` | `page,pageSize,q,isValid?` | `{id,serial,issuedAt,isValid,user,course,score}` | Fixed |
| Lookup certs | `GET /lookup/certificates?q=` | same | `q>=2` | cert array | Fixed |

## 2) Mismatch Board (P0/P1/P2)

- P0 fixed:
  - Missing admin dashboard stats endpoint.
  - Certificates DTO mismatch (`certificateId/issueDate` -> `serial/issuedAt`).
  - Users page calling learners endpoint.
  - Admin auth token mismatch in API client (`user.token` -> `user.accessToken`).
- P1 fixed:
  - Validation now writes parsed values back to `req` and returns structured errors.
  - Added error contract fields: `code`, `details[]`.
  - Added action-level RBAC restriction for destructive admin route (`DELETE /courses/:id`).
- P2 remaining:
  - Legacy learning components still call old endpoints (`/api/orders`, `/api/progress`, `/api/courses/:id/learn`).
  - Need dedicated aggregates endpoint for billing dashboard (avoid sampling by page size).

## 3) Student/Public Contract Audit (post-admin)

High-risk checks:
- Enroll paid flow:
  - FE now calls `/api/v1/payment/create-link` when `price > 0` or backend responds `402`.
- Exam contract:
  - `GET /api/student/:courseId/status` now includes `passingScore`.
  - Exam payload validation added for `answers` on save/submit.
- Payment status:
  - `GET /api/v1/payment/status/:orderCode` now returns `orderCode` and `amount`.

Remaining hardening:
- Move student read endpoints from `email` query to JWT user context.
- Remove/replace legacy learning components with current service layer.

## 4) Cross-layer Schema Sync Rules

- Envelope success: `{ status:'success', message, data }`.
- Envelope error: `{ status:'fail'|'error', message, code?, details? }`.
- Pagination: `{ items, page, pageSize, total, totalPages }`.
- IDs:
  - `id` fields remain string ObjectId.
  - `orderCode` represented as number in API payload.
- Admin auth:
  - Store `accessToken` in persisted auth state.
  - API client always injects `Authorization: Bearer <token>`.

## 5) Release Readiness Checklist

- Flow completeness
  - [x] Admin dashboard has real backend data.
  - [x] Admin certificates page renders backend DTO correctly.
  - [x] Users module uses dedicated `/admin/users`.
  - [x] Paid enroll flow can generate payment link.
- API parity
  - [x] No blocking admin FE->BE missing route.
  - [x] Core payment/exam fields aligned (`passingScore`, `orderCode`, `amount`).
- Data parity
  - [x] Certificates fields no longer undefined in UI.
  - [x] Validation returns structured details for FE field mapping.
- Tests/gates
  - [x] Integration RBAC test expanded with dashboard/users + structured validation checks.
  - [ ] Add FE integration tests for admin hooks/pages.
  - [ ] Add e2e test for paid enroll checkout success path.
