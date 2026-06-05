    # Bộ Rule — Sequence Diagram (Phase 1 + Phase 2A)
    ## 4N Clinic Management System — SE104

    > **Mục đích:** Chốt một bộ luật thống nhất để vẽ sequence diagram, dùng chung cho
    > requirement → diagram → backend → frontend → database → test. Sequence diagram chỉ
    > được vẽ **sau khi rule của UC đã chốt** (xem §3). Diagram phải phản ánh đúng kiến trúc
    > đã được audit (Mode A/A.1), không bịa participant, không bịa nhánh.
    >
    > **Nguồn căn cứ (đọc trước khi vẽ):**
    > - `MODE_C_CONTEXT.md` — 40 endpoints, RBAC, state machine, BR-01..09, BR-P2-01..16
    > - `backend/prisma/schema.prisma` — verify field name trước khi đặt message
    > - `backend/src/modules/**` — luồng Controller→Service→Prisma thực tế là source of truth
    > - Quy tắc bất biến: **Design → Approve → Migration → Implement**, diagram thuộc bước Design

    ---

    ## 0. Quy ước chung & công cụ

    | Hạng mục | Quy ước |
    |---|---|
    | Ngôn ngữ vẽ | **Mermaid** `sequenceDiagram` (đồng bộ với ERD/Class `.mmd` đang dùng) |
    | File nguồn | `04_DIAGRAM_SOURCES/SEQ_*.mmd`, mỗi UC/luồng một file |
    | Đặt tên | `SEQ_P1_01_CreateVisit.mmd`, `SEQ_P2_02_Dispense.mmd` (theo ID ở §6/§7) |
    | Render | Mermaid Live / VS Code Mermaid ext → PNG/SVG vào `rendered/` (xem `GUIDE_Add_Diagrams_to_Document.md`) |
    | Ngôn ngữ label | **Tiếng Anh** cho message kỹ thuật (tránh lỗi font); chú thích nghiệp vụ có thể tiếng Việt trong `note` |
    | Tiền tệ / ngày | Decimal cho tiền, Date cho ngày — ghi rõ trong note nếu liên quan snapshot |

    **Quy tắc số 1:** Một sequence diagram mô tả **một kịch bản UC**, không gộp nhiều UC. Happy path là khung
    chính; mọi nhánh lỗi nghiệp vụ bắt buộc thể hiện bằng `alt`/`opt` (không được bỏ).

    ---

    ## 1. Participant (lifeline) chuẩn — KHÔNG đặt tùy tiện

    Mọi sequence diagram phải dùng đúng tập participant phản ánh layer thật của hệ thống
    (NestJS modular monolith, layered). Thứ tự từ trái sang phải:

    | Bí danh | Loại | Tên hiển thị | Khi nào xuất hiện |
    |---|---|---|---|
    | `Actor` | `actor` | Vai trò người dùng (Receptionist, Doctor, Cashier, Nurse, LabTech, Pharmacist, Admin, Manager) | Luôn — đúng role được phép gọi UC |
    | `FE` | participant | `React SPA` (TanStack Query) | Luôn |
    | `GD` | participant | `JwtAuthGuard + RolesGuard` | Luôn (trừ `/auth/login`, `/auth/refresh` là PUBLIC) |
    | `CT` | participant | `XxxController` (tên thật, vd `VisitsController`) | Luôn |
    | `SV` | participant | `XxxService` (tên thật, vd `VisitsService`) | Luôn |
    | `TX` | participant | `Prisma $transaction` | Chỉ khi UC có giao dịch (xem §4) |
    | `DB` | participant | `PostgreSQL` | Luôn |
    | `AU` | participant | `AuditService` | Khi UC sinh audit event (xem §5) |
    | `EXT` | participant | Service phụ thuộc khác (vd `RegulationsService`, `PrescriptionsService`) | Khi service gọi service khác |

    **Rule participant:**
    1. Controller **không bao giờ** chứa business logic — message từ `CT` chỉ là delegate `SV.method(dto, actorId)`.
    2. Mọi business rule (BR-*) nằm ở `SV` ↔ `DB`/`TX`. Không vẽ rule check ở `CT` hay `GD`.
    3. `GD` chỉ làm 2 việc: xác thực JWT + kiểm tra role. **Không** dùng `GD` thay cho business validation.
    4. Tên `CT`/`SV` phải khớp file thật trong `backend/src/modules/`. Nếu chưa tồn tại (Phase 2A) → tên theo
    API contract ở `MODE_C_CONTEXT.md §3.8` và đánh dấu `note: PLANNED (Phase 2A)`.

    ---

    ## 2. Ký hiệu Mermaid bắt buộc

    | Ý nghĩa | Cú pháp | Bắt buộc dùng khi |
    |---|---|---|
    | Gọi đồng bộ (request) | `A->>B: message` | mọi lời gọi |
    | Trả về (response) | `B-->>A: result` | mọi kết quả/trả dữ liệu |
    | Nhánh điều kiện loại trừ | `alt ... else ... end` | mỗi lỗi nghiệp vụ / mỗi rẽ nhánh trạng thái |
    | Nhánh tùy chọn | `opt ... end` | bước có thể có/không (vd prescription, reason) |
    | Lặp | `loop ... end` | xử lý danh sách (InvoiceItems, DispenseItems, FEFO lots) |
    | Song song | `par ... and ... end` | thao tác độc lập đồng thời (hiếm — chỉ khi thật sự) |
    | Vùng giao dịch | `rect rgb(235,235,255)` + `note` `BEGIN/COMMIT` | bọc toàn bộ block trong `$transaction` (§4) |
    | Activation bar | `activate`/`deactivate` (hoặc `->>+` / `-->>-`) | nên dùng để thấy rõ vòng đời call của `SV`/`TX` |
    | Ghi chú nghiệp vụ | `note over X: ...` / `note right of X: ...` | snapshot, state transition, BR id, race-condition |

    **Rule ký hiệu:**
    - Mỗi `alt` nhánh lỗi phải ghi **HTTP status + exception** thật, vd `400 BadRequestException`, `404 NotFoundException`, `409 ConflictException`, `401`, `403`.
    - Mỗi message tới `DB` ghi đúng **operation Prisma**: `visit.findFirst`, `visit.create`, `invoice.update`, `stockLot.update`… (verify theo service thật).
    - Không để mũi tên cụt: mọi `->>` quan trọng phải có `-->>` tương ứng (trừ fire-and-forget audit, được phép vẽ một chiều kèm note).
    - **Exception phải lan theo đúng layer, KHÔNG nhảy tắt.** `Prisma $transaction`/`DB` không trả thẳng về `FE`.
    Service ném exception, NestJS exception filter map sang HTTP rồi đi ngược chuỗi:
    ```
    TX/DB -->> SV : throw XxxException
    SV   -->> CT : (propagate)
    CT   -->> FE : <HTTP status>
    ```
    Áp dụng cho **mọi** nhánh lỗi (kể cả lỗi trong vùng `$transaction`). Đây là hệ quả của rule participant
    §1.1 — Controller delegate, business rule nằm ở Service; lỗi cũng phải đi ngược qua Service/Controller.

    ---

    ## 3. Rule Baseline cho MỖI UC (chốt trước khi vẽ)

    Trước khi vẽ bất kỳ sequence diagram nào, UC phải trả lời đủ 13 mục. Đây là khung chung cho
    requirement/diagram/backend/frontend/DB/test:

    | # | Nhóm rule | Phải chốt | Ảnh hưởng đến diagram |
    |---|---|---|---|
    | 1 | Mục tiêu UC | Kết quả cuối là gì | Message cuối cùng `FE-->>Actor` |
    | 2 | Actor / RBAC | Role nào được, role nào cấm | `actor` + nhánh `403` ở `GD` |
    | 3 | Input / DTO | API nhận gì | Message `FE->>CT` payload |
    | 4a | DTO validation | Field bắt buộc, định dạng (class-validator) | `alt 400` tại **ValidationPipe / Controller boundary**, trước khi gọi `SV` |
    | 4b | Business validation | Tồn tại, trạng thái hợp lệ, quota | `alt 404/409` trong **`SV`/`TX`**, sau khi DTO đã hợp lệ |
    | 5 | Business rule | BR-* chính | note BR-id + nhánh `alt` |
    | 6 | State transition | Trạng thái nào → nào | `note` cập nhật status + `DB: x.update status` |
    | 7 | Database effect | Bảng đọc / ghi | message tới `DB` |
    | 8 | Transaction | Có cần `$transaction`? race? | `rect` BEGIN/COMMIT (§4) |
    | 9 | Error case | 400/401/403/404/409 khi nào | từng `alt` lỗi |
    | 10 | Audit/log | Ghi action gì | message `SV->>AU` (§5) |
    | 11 | Output | Trả gì cho FE | response shape |
    | 12 | Snapshot | Có lưu snapshot? | note "snapshot at … time" (§ snapshot) |
    | 13 | Test case | Happy + error path | mỗi `alt` ⇄ một test case |

    > Nếu một mục chưa chốt → **chưa vẽ diagram cho UC đó**. Diagram thiếu nhánh lỗi = diagram sai.

    **Phân tầng validation (rule cứng):**
    ```
    FE ->> GD : request + token
    GD ->> CT : authorized
    note over CT: ValidationPipe kiểm DTO (class-validator)
    alt DTO không hợp lệ (thiếu field / sai định dạng)
        CT -->> FE : 400 BadRequestException
    else DTO hợp lệ
        CT ->> SV : method(dto, actorId)
        note over SV: business validation (tồn tại, trạng thái, quota)
        %% 404 / 409 phát sinh ở đây, propagate SV -> CT -> FE
    end
    ```
    - `400` (DTO) thuộc **boundary Controller/Pipe**, KHÔNG vẽ trong `SV`.
    - `404`/`409` (nghiệp vụ) thuộc **`SV`/`TX`**, propagate ngược về `FE` theo rule §2.

    ---

    ## 4. Rule biểu diễn Transaction & chống race condition

    UC dưới đây **bắt buộc** có vùng `$transaction` trong diagram (đã verify trong code Phase 1; Phase 2A theo baseline):

    | UC / luồng | Lý do | Phase |
    |---|---|---|
    | Tạo lượt khám (queue number + cap) | tránh trùng số thứ tự, vượt quota | P1 — BR-01/02/03 |
    | Mở lượt khám | tránh tạo trùng Examination | P1 |
    | Upsert đơn thuốc (replace-all) | diagnosis + prescription nhất quán | P1 — BR-08 |
    | Hoàn tất phiếu khám | exam status + điều kiện | P1 — BR-07 |
    | Lập hóa đơn + InvoiceItems | tính tiền + item phải cùng commit | P1 — BR-04/05 |
    | Ghi nhận thanh toán + cập nhật status | payment + invoice status đồng bộ | P1 — BR-06 |
    | Kích hoạt quy định | deactivate version cũ + activate mới | P1 — BR-09 |
    | Check-in appointment → Visit + QueueTicket | atomic 2 bản ghi | P2 — BR-P2-02 |
    | Cấp phát thuốc (Dispense) | DispenseItem + StockMovement OUT + decrement tồn | P2 — BR-P2-10/11 |
    | Hoàn cấp phát (Reversal) | StockMovement REVERSAL + increment tồn | P2 — BR-P2-12 |

    **Rule transaction trong diagram:**
    1. Bọc đúng block bằng `rect rgb(...)` + `note over TX: BEGIN $transaction` ở đầu, `note over TX: COMMIT` ở cuối.
    2. **Validation đọc-trước không đổi dữ liệu** (vd `patient.findUnique`, `getMaxPatientsPerDay`) đặt **ngoài** transaction
    — phản ánh đúng code (visits.service: lookup patient + cap **trước** `$transaction`).
    3. Check race-condition (duplicate, count quota, queueNumber max) đặt **trong** transaction, có `note: BR-03 atomic`.
    4. Với UC có isolation đặc biệt ghi rõ: `note over TX: Serializable` (tạo visit dùng Serializable).
    5. **AuditService.log đặt NGOÀI transaction, sau COMMIT** — đúng pattern code (audit chạy sau khi visit/exam đã commit).

    ---

    ## 5. Rule Audit log

    Phase 1 chỉ log 8 action: `LOGIN_SUCCESS, LOGIN_FAILED, CREATE_PATIENT, CREATE_VISIT, OPEN_EXAMINATION,
    COMPLETE_EXAMINATION, CREATE_INVOICE, CREATE_PAYMENT`. Phase 2A bổ sung (DISPENSE, STOCK_MOVEMENT,
    LAB_RESULT_ENTERED, REGULATION_ACTIVATE, USER_LOCK, ROLE_PERMISSION_CHANGE, VISIT_CANCEL, PATIENT_UPDATE).

    **Rule:**
    1. Chỉ vẽ message `SV->>AU: log(action, entityType, entityId, after)` cho UC **thực sự** sinh audit (xem danh sách).
    2. Audit là bước **sau commit**, vẽ một chiều, kèm `note right of AU: append-only`.
    3. UC chưa có audit ở Phase 1 (vd VISIT_CANCEL) → **không** vẽ `AU`; nếu là target Phase 2A thì vẽ kèm `note: NEW audit (Phase 2A)`.
    4. Login fail vẫn ghi `LOGIN_FAILED` — diagram UC01 phải có nhánh `alt 401 -> AU.log(LOGIN_FAILED)`.
    5. **`REGULATION_ACTIVATE` KHÔNG có trong code Phase 1** (`regulations.service.ts::activate` đã verify: không
    inject `AuditService`). Vậy diagram As-Built UC17 (SEQ-P1-09) **không vẽ `AU`**. Nếu vẽ audit cho activate,
    bắt buộc đánh dấu `note over AU: RECOMMENDED — chưa implement (hardening / Phase 2A)`. Đây là quyết định
    sửa code, không trộn lẫn với hiện trạng. Khuyến nghị: nên thêm vì activate đổi quota/tiền khám (nhạy cảm).

    ---

    ## 6. Rule riêng — Phase 1 (sequence diagram cần làm)

    **Rule: mỗi UC một diagram chi tiết** (tuân thủ Quy tắc số 1 — không gộp UC). Diagram gộp "Doctor→Cashier
    flow" chỉ được dùng ở mức **overview**, KHÔNG thay thế các diagram chi tiết bên dưới.

    | ID | UC | Kịch bản | Actor | Điểm bắt buộc trong diagram |
    |---|---|---|---|---|
    | **SEQ-P1-01** | UC07 | Tạo lượt khám | Receptionist | `$transaction` Serializable; alt 404 patient, 409 duplicate, 409 cap; queueNumber atomic; audit CREATE_VISIT |
    | **SEQ-P1-02** | UC09 | Mở lượt khám | Doctor | validate doctor ACTIVE (ngoài TX); `$transaction`: 1 exam/visit (409), visit==WAITING (400); state WAITING→IN_EXAMINATION; audit OPEN_EXAMINATION |
    | **SEQ-P1-03** | UC10 | Lập / cập nhật phiếu khám | Doctor | chỉ sửa khi exam OPEN (alt 409 nếu COMPLETED/CANCELLED); cập nhật symptoms/clinicalNotes/conclusion |
    | **SEQ-P1-04** | UC12 | Kê đơn thuốc (upsert) | Doctor | `$transaction` replace-all (BR-08); opt — exam có thể không có đơn; snapshot tên/đơn giá thuốc (§8) |
    | **SEQ-P1-05** | UC13 | Hoàn tất phiếu khám | Doctor | BR-07: cần symptoms + conclusion + ≥1 diagnosis (alt 400); state OPEN→COMPLETED; audit COMPLETE_EXAMINATION |
    | **SEQ-P1-06** | UC14 | Lập hóa đơn | Cashier | BR-04 chỉ từ visit COMPLETED (alt 409); BR-05 unique invoice/visit; `$transaction` invoice + `loop` InvoiceItems; snapshot giá; audit CREATE_INVOICE |
    | **SEQ-P1-07** | UC15 | Ghi nhận thanh toán | Cashier | BR-06 amount ≤ remaining (alt 409/400); `$transaction` payment + cập nhật status; state ISSUED→PARTIALLY_PAID→PAID; audit CREATE_PAYMENT |
    | **SEQ-P1-08** | UC01 | Đăng nhập | All | PUBLIC (no `GD`); bcrypt compare; alt 401 không lộ email tồn tại; token rotation; audit LOGIN_SUCCESS/FAILED |
    | **SEQ-P1-09** | UC17 | Kích hoạt quy định | Admin | `$transaction` deactivate-all + activate (BR-09); note "không hồi tố"; **không vẽ `AU`** (xem §5.5) |
    | SEQ-P1-OV (tùy chọn) | UC09–15 | Overview Doctor→Cashier | Doctor + Cashier | chỉ overview, message ở mức UC, không thay diagram chi tiết |

    **Rule trạng thái Phase 1 (As-Built — đúng code, KHÔNG suy diễn):**
    ```
    Visit:        WAITING → IN_EXAMINATION → COMPLETED  (↘ CANCELLED)
    Examination:  OPEN → COMPLETED  (↘ CANCELLED)   [complete cần: symptoms + conclusion + ≥1 diagnosis]
    Invoice:      DRAFT → ISSUED → PARTIALLY_PAID → PAID  (mọi state ↘ VOID)
    ```
    > ⚠️ **`VisitStatus.REGISTERED` có trong enum (`schema.prisma`) nhưng KHÔNG được dùng ở Phase 1** —
    > `visits.service.create` tạo thẳng `status=WAITING`. → Diagram Phase 1 bắt đầu từ **WAITING**, KHÔNG vẽ
    > nhánh `REGISTERED → WAITING`. `REGISTERED` là state **reserved** cho luồng appointment/check-in Phase 2A
    > (xem §7). Nếu vẽ nó ở P1 sẽ sai code và gây rối khi vấn đáp.

    - Cấm vẽ: lập phiếu khám khi Visit chưa mở; hóa đơn khi chưa có exam COMPLETED; sửa exam khi đã COMPLETED/CANCELLED;
    thanh toán khi chưa có invoice. Mỗi điều cấm = một nhánh `alt` lỗi trong diagram.

    ---

    ## 7. Rule riêng — Phase 2A (sequence diagram cần làm)

    | ID | Kịch bản | Actor chính | Điểm bắt buộc (BR) |
    |---|---|---|---|
    | **SEQ-P2-01** | Appointment → Check-in → Queue → Nurse → Doctor | Receptionist/Nurse/Doctor | check-in tạo Visit{appointmentId,departmentId,doctorProfileId} + QueueTicket{priority=1} trong 1 `$transaction` (BR-P2-02); walk-in priority=0 (BR-P2-01); queueNumber unique theo (departmentId, queueDate) (BR-P2-03); idempotent qua `Visit.appointmentId @unique` (OQ-002) |
    | **SEQ-P2-02** | Cấp phát thuốc + trừ kho FEFO | Pharmacist | `loop` chọn lot theo FEFO (expiryDate gần nhất, BR-P2-09); `$transaction`: DispenseItem + StockMovement OUT + decrement quantityOnHand (BR-P2-10); **note đỏ: trừ kho CHỈ khi dispense, không khi kê đơn/complete exam (BR-P2-11)** |
    | SEQ-P2-03 (nên có) | Lab: order → collect → result → review | Doctor + LabTech | ServiceType=LAB_TEST tạo LabOrder, state sync (BR-P2-07); result immutable sau RESULT_ENTERED; **reviewer ≠ người nhập result (BR-P2-08)** → alt 400/409 |
    | SEQ-P2-04 (nên có) | Reversal cấp phát | Pharmacist | chỉ khi chưa thanh toán (BR-P2-12); StockMovement REVERSAL + increment tồn; alt 409 nếu đã PAID |
    | SEQ-P2-05 (nên có) | Hóa đơn đa nguồn | Cashier | gom exam fee + ServiceOrder COMPLETED + DispenseItem, tất cả priceSnapshot (BR-P2-13); chống trùng InvoiceItem theo (referenceType, referenceId) (BR-P2-14); cấm VOID nếu có payment (BR-P2-15) |

    **Rule trạng thái Phase 2A (đúng baseline — chú ý các CF correction):**
    ```
    Appointment:  SCHEDULED → CHECKED_IN  (↘ CANCELLED / NO_SHOW)
    QueueTicket:  WAITING → CALLED → IN_SERVICE → DONE  (↘ SKIPPED / CANCELLED)
    ServiceOrder: ORDERED → IN_PROGRESS → COMPLETED  (↘ CANCELLED)
    LabOrder:     ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → REVIEWED  (↘ CANCELLED)   [REVIEWED, KHÔNG phải VERIFIED — CF-001]
    Dispense:     DISPENSED → REVERSED   [chỉ 2 state — CF-003, KHÔNG có PENDING/CANCELLED]
    ```
    > ⚠️ Diagram Phase 2A vẽ theo **schema sau correction migration** (CF-001..009), không theo schema working-tree
    > hiện tại. Field dùng trong message phải là tên canonical (`reviewedById`, `scheduledStartAt/scheduledEndAt`,
    > `isRequiredForCompletion`…).

    **7.1 — Rule "PLANNED" bắt buộc (mọi diagram Phase 2A):**
    Controller/Service Phase 2A (`PharmacyController`, `LabOrdersController`, `QueueService`…) **chưa tồn tại trong
    code** (gate STOP-IMPLEMENTATION). Mỗi diagram Phase 2A phải mở đầu bằng note cố định để người đọc không tưởng
    đã implement:
    ```mermaid
    note over CT,SV: PLANNED Phase 2A — not implemented in current backend
    ```

    **7.2 — Rule RBAC role mới (NURSE, LAB_TECHNICIAN, PHARMACIST):**
    8 role đã được **seed** nhưng Phase 1 chỉ active RBAC/nav cho 5 (ADMIN, DOCTOR, RECEPTIONIST, CASHIER, MANAGER);
    NURSE/LAB_TECHNICIAN/PHARMACIST **chưa có route/guard/nav** (TD-006). Trước khi vẽ diagram P2A có 3 actor này,
    phải chốt & đồng bộ 6 nơi (nếu lệch → diagram thiếu nền phân quyền):
    ```
    [ ] Role enum / seed              (đã seed — verify)
    [ ] RBAC matrix (role × endpoint) theo MODE_C_CONTEXT §3.8
    [ ] Frontend route guard (RequireRole)
    [ ] Backend @Roles trên controller mới
    [ ] Test authorization (401/403)
    [ ] Sequence participant (actor đúng role)
    ```
    - `actor` trong diagram P2A phải khớp cột Roles ở `MODE_C_CONTEXT §3.8` (vd Dispense = PHARMACIST/ADMIN;
    Lab result = LAB_TECHNICIAN; Lab review = DOCTOR/ADMIN; Queue status = NURSE/DOCTOR/ADMIN).
    - `REGISTERED` (reserved ở P1) là state khởi tạo hợp lệ cho luồng appointment check-in nếu thiết kế P2A dùng;
    nếu check-in tạo thẳng `WAITING` thì ghi rõ trong diagram, không để mơ hồ.

    ---

    ## 8. Rule Snapshot & dữ liệu lịch sử (ảnh hưởng message)

    Khi diagram đụng tới dữ liệu có ý nghĩa lịch sử, message ghi tạo bản ghi phải kèm `note: snapshot at <time>`:

    | Tình huống | Field snapshot trong diagram |
    |---|---|
    | Chẩn đoán | `diseaseNameSnapshot` lúc khám (đổi danh mục không ảnh hưởng) |
    | Đơn thuốc | tên thuốc/đơn vị/đơn giá lúc kê |
    | Hóa đơn item | `unitPriceSnapshot`, `description`, `itemType` lúc lập |
    | ServiceOrder | `priceSnapshot` từ ServiceCatalog lúc order (BR-P2-06) |
    | DispenseItem | `unitPriceSnapshot` lúc cấp phát |

    Rule: không vẽ message chỉ lưu foreign key cho các bản ghi lịch sử — phải kèm field snapshot trong note.

    ---

    ## 9. Template Mermaid chuẩn (copy để bắt đầu)

    ```mermaid
    sequenceDiagram
        autonumber
        actor Actor as Receptionist
        participant FE as React SPA
        participant GD as JwtAuthGuard + RolesGuard
        participant CT as VisitsController
        participant SV as VisitsService
        participant TX as Prisma $transaction
        participant DB as PostgreSQL
        participant AU as AuditService

        Actor->>FE: Điền form (input UC)
        FE->>CT: POST /endpoint {dto} + Bearer token

        GD->>GD: verify JWT + role
        alt token invalid
            GD-->>FE: 401 Unauthorized
        else role not allowed
            GD-->>FE: 403 Forbidden
        else authorized
            GD->>CT: proceed
            note over CT: ValidationPipe kiểm DTO
            alt DTO không hợp lệ
                CT-->>FE: 400 BadRequestException
            else DTO hợp lệ
                CT->>SV: method(dto, actorId)

                %% --- business validation đọc-trước, NGOÀI transaction ---
                SV->>DB: x.findUnique(...)
                alt not found
                    DB-->>SV: null
                    SV-->>CT: throw NotFoundException
                    CT-->>FE: 404 Not Found
                else valid
                    rect rgb(235,235,255)
                        note over TX: BEGIN $transaction (Serializable nếu cần)
                        SV->>TX: start
                        TX->>DB: check duplicate / quota (BR-xx atomic)
                        alt business conflict
                            TX-->>SV: throw ConflictException
                            SV-->>CT: (propagate)
                            CT-->>FE: 409 Conflict
                        else ok
                            TX->>DB: x.create / x.update (note: state A→B; snapshot)
                        end
                        note over TX: COMMIT
                    end
                    SV->>AU: log(ACTION, entityType, entityId, after)
                    note right of AU: append-only, sau COMMIT
                    SV-->>CT: result
                    CT-->>FE: 201 / 200 {output}
                    FE-->>Actor: hiển thị kết quả (vd queueNumber)
                end
            end
        end
    ```

    ---

    ## 10. Ví dụ đã đối chiếu code — SEQ-P1-01: Tạo lượt khám (UC07)

    > Vẽ đúng theo `visits.service.ts::create` (đã đọc): patient lookup + cap **ngoài** TX; duplicate/count/queueNumber
    > **trong** TX (Serializable); audit **sau** commit.

    ```mermaid
    sequenceDiagram
        autonumber
        actor RC as Receptionist
        participant FE as React SPA
        participant GD as JwtAuthGuard + RolesGuard
        participant CT as VisitsController
        participant SV as VisitsService
        participant TX as Prisma $transaction
        participant DB as PostgreSQL
        participant AU as AuditService

        RC->>FE: Chọn bệnh nhân + ngày khám
        FE->>CT: POST /visits {patientId, visitDate, reason}
        GD->>GD: verify JWT + role ∈ {RECEPTIONIST, ADMIN}
        alt not RECEPTIONIST/ADMIN
            GD-->>FE: 403 Forbidden
        else authorized
            note over CT: ValidationPipe kiểm DTO (patientId, visitDate)
            alt DTO không hợp lệ
                CT-->>FE: 400 Bad Request
            else DTO hợp lệ
                CT->>SV: create(dto, userId)
                SV->>DB: patient.findUnique(id)
                alt patient null
                    DB-->>SV: null
                    SV-->>CT: throw NotFoundException
                    CT-->>FE: 404 "Patient not found"
                else patient ok
                    SV->>DB: regulationVersion.findFirst(isActive) → MAX_PATIENTS_PER_DAY (fallback 40)
                    rect rgb(235,235,255)
                        note over TX: BEGIN $transaction (Serializable) — BR-03
                        SV->>TX: run
                        TX->>DB: visit.findFirst(patientId, visitDate)
                        alt đã có visit hôm nay
                            TX-->>SV: throw ConflictException (BR-02)
                            SV-->>CT: (propagate)
                            CT-->>FE: 409 "Patient already has a visit on this date"
                        else chưa có
                            TX->>DB: visit.count(visitDate, status≠CANCELLED)
                            alt count ≥ max
                                TX-->>SV: throw ConflictException (BR-01)
                                SV-->>CT: (propagate)
                                CT-->>FE: 409 "Daily patient limit reached"
                            else còn slot
                                TX->>DB: visit.findFirst(visitDate order queueNumber desc)
                                TX->>DB: visit.create(queueNumber+1, status=WAITING)
                                note over TX: state ∅ → WAITING
                            end
                        end
                        note over TX: COMMIT
                    end
                    SV->>AU: log(CREATE_VISIT, Visit, id, {patientId, visitDate, queueNumber})
                    SV-->>CT: visit (+ patient)
                    CT-->>FE: 201 {visit}
                    FE-->>RC: Hiển thị số thứ tự (queueNumber)
                end
            end
        end
    ```

    ---

    ## 11. Ví dụ Phase 2A — SEQ-P2-02: Cấp phát thuốc + trừ kho FEFO (BR-P2-09/10/11)

    ```mermaid
    sequenceDiagram
        autonumber
        actor PH as Pharmacist
        participant FE as React SPA
        participant GD as JwtAuthGuard + RolesGuard
        participant CT as PharmacyController
        participant SV as PharmacyService
        participant TX as Prisma $transaction
        participant DB as PostgreSQL
        participant AU as AuditService

        note over CT,SV: PLANNED (Phase 2A) — vẽ theo schema sau correction migration
        PH->>FE: Chọn prescription COMPLETED để cấp phát
        FE->>CT: POST /pharmacy/dispense {prescriptionId}
        GD->>GD: role ∈ {PHARMACIST, ADMIN}
        alt not allowed
            GD-->>FE: 403 Forbidden
        else authorized
            CT->>SV: dispense(dto, actorId)
            SV->>DB: prescription.findUnique(include items)
            alt exam chưa COMPLETED / không tồn tại
                DB-->>SV: invalid
                SV-->>CT: throw Conflict/NotFound
                CT-->>FE: 409 / 404
            else hợp lệ
                rect rgb(245,235,255)
                    note over TX: BEGIN $transaction — BR-P2-10 atomic
                    loop mỗi PrescriptionItem
                        TX->>DB: stockLot.findMany(drugId, qoh>0 order expiryDate asc) — FEFO (BR-P2-09)
                        alt tồn không đủ
                            TX-->>SV: throw ConflictException
                            SV-->>CT: (propagate, rollback)
                            CT-->>FE: 409 "Insufficient stock"
                        else đủ
                            TX->>DB: dispenseItem.create(unitPriceSnapshot, lotId)
                            TX->>DB: stockMovement.create(type=OUT, ref=Dispense)
                            TX->>DB: stockLot.update(quantityOnHand -= qty)
                        end
                    end
                    TX->>DB: dispense.create(status=DISPENSED)
                    note over TX: COMMIT
                end
                note right of SV: ⚠ BR-P2-11 — trừ kho CHỈ tại đây,<br/>KHÔNG khi kê đơn / complete exam
                SV->>AU: log(DISPENSE + STOCK_MOVEMENT)
                SV-->>CT: dispense
                CT-->>FE: 201 {dispense}
                FE-->>PH: Xác nhận đã cấp phát
            end
        end
    ```

    ---

    ## 12. Checklist trước khi finalize MỖI sequence diagram

    ```
    [ ] Đúng 1 UC/1 kịch bản, không gộp (overview chỉ là phụ, không thay chi tiết)
    [ ] Participant đúng layer & đúng tên service/controller thật (hoặc PLANNED cho P2A)
    [ ] Actor = đúng role được phép (khớp RBAC §2.3 / §3.8 MODE_C_CONTEXT)
    [ ] Có nhánh 403 (role sai) — trừ endpoint PUBLIC
    [ ] 400 (DTO) ở Controller/Pipe; 404/409 (nghiệp vụ) ở Service/TX — KHÔNG lẫn lộn
    [ ] Exception propagate TX/DB → SV → CT → FE (không nhảy tắt TX→FE)
    [ ] Business validation đọc-trước nằm NGOÀI transaction
    [ ] Vùng $transaction được bọc rect + BEGIN/COMMIT (nếu UC cần TX theo §4)
    [ ] Race-condition check (duplicate/count/queueNumber/stock) nằm TRONG transaction
    [ ] State transition ghi rõ (A → B) khớp state machine §6/§7
    [ ] Snapshot ghi note nếu đụng dữ liệu lịch sử (§8)
    [ ] Audit log đúng action & đặt sau COMMIT (chỉ khi UC có audit §5)
    [ ] Message DB ghi đúng Prisma operation & field name (verify schema.prisma)
    [ ] Mỗi nhánh alt ⇄ ánh xạ được sang ≥1 test case
    [ ] P2A: dùng tên canonical sau CF-001..009 (REVIEWED, reviewedById, scheduledStartAt…)
    [ ] P2A: có note "PLANNED Phase 2A — not implemented" đầu diagram (§7.1)
    [ ] P1: KHÔNG vẽ REGISTERED→WAITING (REGISTERED unused ở P1 — §6)
    [ ] File đặt tên SEQ_PX_NN_*.mmd, render vào rendered/
    ```

    ---

    ## 13. Thứ tự làm việc đề xuất (không nhảy thẳng vào vẽ)

    ```
    1. Chốt danh sách UC P1 + P2A (đã có ở MODE_C_CONTEXT)
    2. Gom UC theo module
    3. Chốt rule tổng quát (file này)
    4. Chốt rule riêng từng UC theo §3 (13 mục)
    5. Viết kịch bản xử lý (happy + error) bằng lời
    6. Vẽ sequence diagram theo template §9
    7. Đối chiếu ngược: controller/service/DB/test có khớp diagram không
    ```

    **Bất biến:** rule → kịch bản → diagram → đối chiếu code/test. Không vẽ diagram trước khi chốt rule.
