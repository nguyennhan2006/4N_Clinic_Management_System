-- =====================================================================
-- 4N Clinic Management System — Database constraint tests
-- =====================================================================
-- Mục tiêu: kiểm thử hộp trắng ở tầng DATABASE. Xác nhận các ràng buộc
-- (UNIQUE, FOREIGN KEY, CHECK, NOT NULL) thực sự được PostgreSQL thực thi,
-- độc lập với tầng service. Đây là lưới an toàn cuối cùng cho toàn vẹn dữ liệu.
--
-- Cách chạy (trên DB test, KHÔNG chạy trên production):
--   createdb clinic_test
--   psql -d clinic_test -f database/schema.sql
--   psql -d clinic_test -v ON_ERROR_STOP=1 -f database/tests/constraints_test.sql
--
-- Toàn bộ test nằm trong 1 transaction và ROLLBACK ở cuối nên KHÔNG để lại dữ liệu.
-- Mỗi test dùng sub-transaction (EXCEPTION block): nếu INSERT vi phạm ràng buộc
-- thì coi là PASS; nếu INSERT lọt qua thì coi là FAIL.
-- =====================================================================

\set ON_ERROR_STOP on
BEGIN;

-- Bộ đếm kết quả
CREATE TEMP TABLE _test_result (name TEXT, passed BOOLEAN, detail TEXT);

-- Hàm tiện ích: kỳ vọng một câu lệnh SQL vi phạm ràng buộc (raise error)
CREATE OR REPLACE FUNCTION _expect_violation(test_name TEXT, stmt TEXT)
RETURNS VOID AS $$
BEGIN
  BEGIN
    EXECUTE stmt;
    -- Nếu chạy tới đây nghĩa là KHÔNG có lỗi -> ràng buộc không chặn -> FAIL
    INSERT INTO _test_result VALUES (test_name, FALSE, 'Statement succeeded but a violation was expected');
  EXCEPTION WHEN others THEN
    -- Có lỗi -> ràng buộc đã chặn đúng -> PASS
    INSERT INTO _test_result VALUES (test_name, TRUE, SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Dữ liệu nền tối thiểu (hợp lệ) để các test tham chiếu
-- ---------------------------------------------------------------------
INSERT INTO users (id, username, full_name, password_hash)
  VALUES ('u-test-1', 'tester', 'Tester', 'hash');

INSERT INTO patients (id, full_name, date_of_birth, gender, phone, citizen_id)
  VALUES ('p-test-1', 'Nguyen Van A', '1990-01-01', 'MALE', '0900000000', '079090000001');

INSERT INTO visits (id, patient_id, visit_date, queue_number, status)
  VALUES ('v-test-1', 'p-test-1', '2026-01-01', 1, 'COMPLETED');

INSERT INTO invoices (id, visit_id, status, total_amount, paid_amount)
  VALUES ('inv-test-1', 'v-test-1', 'ISSUED', 100000, 0);

-- ---------------------------------------------------------------------
-- TEST 1 — UNIQUE: username trùng bị từ chối
-- ---------------------------------------------------------------------
SELECT _expect_violation(
  'DB-UNIQUE-username',
  $$INSERT INTO users (id, username, full_name, password_hash)
    VALUES ('u-dup', 'tester', 'Dup', 'hash')$$);

-- ---------------------------------------------------------------------
-- TEST 2 — UNIQUE: citizen_id trùng bị từ chối (UC5 chống bệnh nhân trùng)
-- ---------------------------------------------------------------------
SELECT _expect_violation(
  'DB-UNIQUE-citizen_id',
  $$INSERT INTO patients (id, full_name, date_of_birth, gender, phone, citizen_id)
    VALUES ('p-dup', 'B', '1991-01-01', 'FEMALE', '0900000001', '079090000001')$$);

-- ---------------------------------------------------------------------
-- TEST 3 — UNIQUE composite: (visit_date, queue_number) trùng bị từ chối
--          Đảm bảo số thứ tự hàng đợi không bị cấp trùng trong cùng ngày.
-- ---------------------------------------------------------------------
SELECT _expect_violation(
  'DB-UNIQUE-visit_queue',
  $$INSERT INTO visits (id, patient_id, visit_date, queue_number, status)
    VALUES ('v-dup', 'p-test-1', '2026-01-01', 1, 'WAITING')$$);

-- ---------------------------------------------------------------------
-- TEST 4 — UNIQUE: một visit chỉ có tối đa một invoice (visit_id UNIQUE)
-- ---------------------------------------------------------------------
SELECT _expect_violation(
  'DB-UNIQUE-invoice_visit',
  $$INSERT INTO invoices (id, visit_id, status, total_amount, paid_amount)
    VALUES ('inv-dup', 'v-test-1', 'DRAFT', 0, 0)$$);

-- ---------------------------------------------------------------------
-- TEST 5 — FOREIGN KEY: visit tham chiếu patient không tồn tại bị từ chối
-- ---------------------------------------------------------------------
SELECT _expect_violation(
  'DB-FK-visit_patient',
  $$INSERT INTO visits (id, patient_id, visit_date, queue_number, status)
    VALUES ('v-orphan', 'p-not-exist', '2026-02-01', 5, 'WAITING')$$);

-- ---------------------------------------------------------------------
-- TEST 6 — CHECK: invoice.total_amount âm bị từ chối
-- ---------------------------------------------------------------------
SELECT _expect_violation(
  'DB-CHECK-invoice_total_nonneg',
  $$INSERT INTO invoices (id, visit_id, status, total_amount, paid_amount)
    VALUES ('inv-neg', 'v-test-1', 'DRAFT', -1, 0)$$);

-- ---------------------------------------------------------------------
-- TEST 7 — NOT NULL: patient thiếu full_name bị từ chối
-- ---------------------------------------------------------------------
SELECT _expect_violation(
  'DB-NOTNULL-patient_name',
  $$INSERT INTO patients (id, full_name, date_of_birth, gender, phone)
    VALUES ('p-noname', NULL, '1990-01-01', 'MALE', '0900000002')$$);

-- ---------------------------------------------------------------------
-- TEST 8 — Positive control: một INSERT hợp lệ PHẢI thành công
--          (đảo logic: nếu nó lỗi thì test fail)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO patients (id, full_name, date_of_birth, gender, phone, citizen_id)
      VALUES ('p-valid', 'Valid Person', '1995-05-05', 'FEMALE', '0900000003', '079090000002');
    INSERT INTO _test_result VALUES ('DB-POSITIVE-valid_insert', TRUE, 'Valid insert succeeded as expected');
  EXCEPTION WHEN others THEN
    INSERT INTO _test_result VALUES ('DB-POSITIVE-valid_insert', FALSE, SQLERRM);
  END;
END $$;

-- ---------------------------------------------------------------------
-- Báo cáo kết quả
-- ---------------------------------------------------------------------
\echo '================ DB CONSTRAINT TEST RESULTS ================'
SELECT
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status,
  name,
  detail
FROM _test_result
ORDER BY passed, name;

\echo '-----------------------------------------------------------'
SELECT
  COUNT(*) FILTER (WHERE passed)        AS passed,
  COUNT(*) FILTER (WHERE NOT passed)    AS failed,
  COUNT(*)                              AS total
FROM _test_result;

-- Thoát với mã lỗi nếu có test fail (hữu ích cho CI)
DO $$
DECLARE n_failed INT;
BEGIN
  SELECT COUNT(*) INTO n_failed FROM _test_result WHERE NOT passed;
  IF n_failed > 0 THEN
    RAISE EXCEPTION '% DB constraint test(s) failed', n_failed;
  END IF;
END $$;

-- Không để lại dữ liệu test
ROLLBACK;
