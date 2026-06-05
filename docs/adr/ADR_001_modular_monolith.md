# ADR-001: Chọn Modular Monolith thay vì Microservices

**Ngày:** 2026-05-15  
**Trạng thái:** ACCEPTED  
**Người quyết định:** Chơn Nhân (PO/Architect)

## Bối cảnh

Cần quyết định architecture cho hệ thống quản lý phòng mạch với team 4 người trong thời gian 2 tháng (SE104 project). Hệ thống có nhiều bounded contexts rõ ràng: identity, clinical, billing, pharmacy, lab.

## Các lựa chọn đã xem xét

**Option A: Microservices**  
- (+) Độc lập deploy, scale riêng từng service  
- (-) Overhead: service discovery, inter-service communication, distributed transactions, 4x configuration  
- (-) Team 4 người sẽ mất 60-70% thời gian cho infra thay vì business logic  
- (-) Distributed transactions cho appointment→visit→queue là rất phức tạp  

**Option B: Modular Monolith** ← Chọn  
- (+) Deploy đơn giản, 1 codebase, 1 DB  
- (+) Transactions atomic qua Prisma $transaction  
- (+) Module boundaries vẫn rõ (separate folders, interfaces)  
- (+) Có thể extract ra microservice sau nếu cần  
- (-) Single point of failure  
- (-) Vertical scaling thay vì horizontal  

**Option C: Layered Monolith (truyền thống)**  
- (-) Không có module boundaries → dễ tạo spaghetti code  
- (-) Khó refactor sau này  

## Quyết định

Chọn **Modular Monolith** với NestJS module system.

Mỗi domain có module riêng: `AuthModule`, `PatientsModule`, `VisitsModule`, v.v. Modules communicate qua exported services (không qua HTTP). Database là shared PostgreSQL qua Prisma.

## Hậu quả

**Tốt hơn:**
- Team có thể implement full feature trong 1 sprint mà không cần coordinate cross-service API
- `$transaction` atomic cho mọi multi-table write
- 1 Swagger UI thay vì N API gateways
- Debug đơn giản hơn nhiều

**Khó hơn:**
- Không thể scale từng module riêng lẻ (chấp nhận được cho phòng mạch 1 site)
- Nếu một module crash, toàn bộ app crash
- Cần discipline để không import modules vòng tròn

## Liên quan

- NestJS module system: `backend/src/app.module.ts`
- Module boundaries: `backend/src/modules/`
- Nếu scale cần thiết sau này: trích xuất BillingModule → BillingService (microservice) là feasible vì interfaces đã rõ
