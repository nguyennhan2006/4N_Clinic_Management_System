# Git Branching Rules

## 1. Branch chính

- `main`: chỉ chứa phiên bản ổn định
- `develop`: nhánh tích hợp làm việc hằng ngày

---

## 2. Branch làm việc theo task

### Prefix được phép dùng

- `feature/`
- `fix/`
- `docs/`
- `chore/`
- `db/`
- `test/`
- `refactor/`

### Mẫu tên branch

```text
<type>/<module>-<short-description>
```

### Ví dụ

- `feature/auth-login`
- `feature/patients-search-api`
- `feature/visits-create-api`
- `db/add-payment-table`
- `docs/update-role-matrix`

---

## 3. Những kiểu branch không dùng

Không dùng:

- `branch-cua-nhan`
- `memberA_work`
- `fix123`
- `new-branch-final-real`

Lý do: không phản ánh nội dung công việc, rất khó quản lý khi số lượng branch tăng.

---

## 4. Quy trình tạo branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ten-task
```

---

## 5. Quy trình hoàn thành branch

```bash
git add .
git commit -m "feat(module): short description"
git push -u origin feature/ten-task
```

Sau đó mở Pull Request vào `develop`.

---

## 6. Quy tắc đồng bộ branch

- Trước khi code: pull `develop` mới nhất
- Trước khi mở PR: rebase hoặc merge `develop` mới nhất nếu branch sống lâu
- Không để branch feature sống quá lâu qua nhiều sprint

---

## 7. Khi nào cần tách branch mới

Tách branch mới khi:

- task độc lập;
- task khác reviewer;
- task có thể merge riêng;
- task liên quan DB/API/docs khác nhau.

Không cố nhồi 3–5 task unrelated vào 1 branch.

---

## 8. Quy tắc với DB branch

Các branch có thay đổi schema nên dùng prefix `db/` hoặc branch feature có ghi rõ mục tiêu DB.

Ví dụ:

- `db/init-prisma-schema`
- `db/add-visit-counter-table`
- `feature/billing-create-invoice-api`

Nếu feature branch đổi schema, PR phải ghi rõ phần DB bị ảnh hưởng.

---

## 9. Quy tắc merge

- Chỉ merge vào `develop` sau review
- Chỉ merge `develop -> main` khi muốn ra bản ổn định hoặc chuẩn bị demo
- Không squash những PR đang cần giữ lịch sử migration tách biệt nếu team đã thống nhất khác

---

## 10. Quy tắc đóng branch

Sau khi PR đã merge:

- xóa branch remote nếu không còn dùng;
- xóa branch local nếu đã sync;
- update backlog hoặc task status.

---

## 11. Danh sách branch khởi đầu khuyến nghị

### Docs / prepare
- `docs/business-rules-v1`
- `docs/role-matrix-v1`
- `docs/api-scope-v1`
- `docs/sprint-plan-v1`

### Core / setup
- `chore/init-backend-scaffold`
- `chore/init-frontend-scaffold`
- `db/init-prisma-schema`

### Implementation sớm
- `feature/auth-login`
- `feature/auth-me`
- `feature/patients-create-api`
- `feature/patients-search-api`
- `feature/visits-create-api`
- `feature/visits-daily-list-api`
