# 4N_Clinic_Management_System

## 1. Mục tiêu dự án

4N_Clinic_Management_System là đồ án môn **SE104 – Nhập môn Công nghệ phần mềm** với đề tài xây dựng **hệ thống quản lý phòng mạch tư nhân** theo hướng:

- ưu tiên **backend, business logic, database và kiến trúc hệ thống**;
- hiện thực theo mô hình **web application**;
- có thể chia việc song song cho nhóm sinh viên;
- đủ thực tế để demo tốt nhưng vẫn gọn, phù hợp phạm vi ver1.

Phiên bản hiện tại là **ver1 / phase 1**.

---

## 2. Phạm vi chức năng ver1

- Đăng nhập, quản lý tài khoản, phân quyền
- Tra cứu bệnh nhân, tạo hồ sơ bệnh nhân
- Tiếp nhận bệnh nhân, tạo lượt khám, xem danh sách khám
- Mở lượt khám, lập phiếu khám, xem lịch sử khám, kê đơn thuốc, hoàn tất phiếu khám
- Lập hóa đơn, ghi nhận thanh toán, tra cứu hóa đơn
- Thay đổi quy định
- Quản lý danh mục bệnh, danh mục thuốc
- Xem báo cáo tháng cơ bản

---

## 3. Actor chính

- Lễ tân
- Bác sĩ
- Thu ngân
- Quản trị viên
- Quản lý phòng mạch

---

## 4. Kiến trúc chốt cho ver1

### 4.1 Kiến trúc tổng thể

Dự án chốt theo hướng:

- **Modular Monolith**
- **REST API**
- **Backend-first**
- **PostgreSQL 18**
- **React Web App**

### 4.2 Lý do chọn

- phù hợp team sinh viên 3–5 người;
- ít rủi ro hơn microservices;
- chia module rõ để làm song song;
- dễ test, dễ demo, dễ maintain;
- có thể tách service ở ver2 nếu hệ thống tăng độ phức tạp.

---

## 5. Stack công nghệ chốt

### Backend
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL 18
- JWT Auth
- Swagger / OpenAPI
- Jest + Supertest

### Frontend
- React
- Vite
- TypeScript
- TanStack Query
- Zustand
- Tailwind CSS
- shadcn/ui

### Dev tools
- Git + GitHub
- VS Code
- Postman hoặc Insomnia
- DBeaver hoặc pgAdmin
- ESLint + Prettier

---

## 6. Cấu trúc repo

```text
4N_Clinic_Management_System/
├─ backend/
├─ frontend/
├─ database/
│  ├─ docs/
│  └─ sql/
├─ docs/
│  ├─ architecture/
│  ├─ business/
│  ├─ api/
│  ├─ agile/
│  ├─ qa/
│  ├─ demo/
│  └─ rules/
├─ scripts/
├─ .github/
├─ README.md
└─ CONTRIBUTING.md
```

---

## 7. Tài liệu cần đọc trước khi code

Tất cả thành viên bắt buộc đọc theo thứ tự sau:

1. `README.md`
2. `CONTRIBUTING.md`
3. `docs/rules/team-working-rules.md`
4. `docs/rules/git-branching-rules.md`
5. `docs/business/business-rules.md`
6. `docs/business/role-matrix.md`
7. `database/docs/erd-implementation.md`
8. `docs/api/api-scope.md`
9. `docs/agile/sprint-plan.md`
10. `docs/qa/test-cases.md`

---

## 8. Hướng triển khai ưu tiên

Thứ tự triển khai chính thức:

1. Auth + RBAC
2. Patient
3. Visit Intake
4. Examination
5. Prescription
6. Billing + Payment
7. Regulation
8. Monthly Report
9. Frontend integration và hardening

---

## 9. Quy ước làm việc ngắn gọn

- Không commit trực tiếp vào `main`
- Không merge vào `develop` khi chưa review
- Không sửa business rule theo cảm tính
- Không thay đổi DB schema mà không cập nhật docs liên quan
- Backend là source of truth cho validation nghiệp vụ
- Swagger là contract chính giữa backend và frontend

---

## 10. Luồng nghiệp vụ demo tối thiểu

Luồng demo chuẩn của ver1:

1. Đăng nhập
2. Tạo hoặc tra cứu bệnh nhân
3. Tiếp nhận và tạo lượt khám
4. Bác sĩ mở khám
5. Cập nhật phiếu khám
6. Kê đơn thuốc
7. Hoàn tất phiếu khám
8. Thu ngân tạo hóa đơn
9. Ghi nhận thanh toán
10. Quản lý xem báo cáo tháng

---

## 11. Trạng thái tài liệu

Tài liệu trong repo này là **working docs** cho team triển khai. Khi có thay đổi lớn về:

- business rules,
- schema,
- API contract,
- quy trình sprint,

thì bắt buộc update file `.md` tương ứng trong cùng PR hoặc PR kế tiếp đã được thống nhất.
