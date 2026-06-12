# ============================================================
# CAPTURE_SCREENSHOTS.ps1
# Script hướng dẫn chụp 16 screenshot còn thiếu cho báo cáo
# Chạy: .\CAPTURE_SCREENSHOTS.ps1 (từ thư mục se104/)
# ============================================================

$BASE = Split-Path -Parent $MyInvocation.MyCommand.Path
$FIGS = "$BASE\figures"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  CHECKLIST CHUP SCREENSHOT BAO CAO SE104" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra file nào đã có
$required = @(
    "screenshots\dashboard-admin.png",
    "screenshots\dashboard-doctor.png",
    "screenshots\sidebar-admin.png",
    "screenshots\sidebar-doctor.png",
    "screenshots\patient-list.png",
    "screenshots\visit-create.png",
    "screenshots\examination-page.png",
    "screenshots\invoice-detail.png",
    "screenshots\pharmacy-worklist.png",
    "ch04-implementation\swagger-ui.png",
    "ch04-implementation\swagger-visits.png",
    "ch05-testing\test-e2e-result.png",
    "ch05-testing\test-payment-error.png",
    "ch06-deployment\terminal-backend.png",
    "ch06-deployment\terminal-frontend.png",
    "ch06-deployment\prisma-studio.png"
)

$missing = @()
$done = @()

foreach ($f in $required) {
    $full = "$FIGS\$f"
    if (Test-Path $full) {
        $done += $f
        Write-Host "  [OK]  $f" -ForegroundColor Green
    } else {
        $missing += $f
        Write-Host "  [---] $f" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Da co: $($done.Count) / $($required.Count)" -ForegroundColor Yellow
Write-Host "Con thieu: $($missing.Count) / $($required.Count)" -ForegroundColor Red
Write-Host ""

if ($missing.Count -eq 0) {
    Write-Host "Tat ca screenshot da co du! Compile LaTeX la xong." -ForegroundColor Green
    exit 0
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  HUONG DAN CHUP TUNG NHOM" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "NHOM 1 - UI SCREENSHOTS (can chay frontend)" -ForegroundColor Yellow
Write-Host "  URL: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "  [1] dashboard-admin.png" -ForegroundColor White
Write-Host "      - Dang nhap: admin@clinic.local / Admin@123456" -ForegroundColor Gray
Write-Host "      - Chup trang Dashboard (F12 -> 1440x900 neu can)" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\dashboard-admin.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [2] dashboard-doctor.png" -ForegroundColor White
Write-Host "      - Dang nhap: doctor@clinic.local / Doctor@123456" -ForegroundColor Gray
Write-Host "      - Chup trang Dashboard" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\dashboard-doctor.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [3] sidebar-admin.png" -ForegroundColor White
Write-Host "      - Dang nhap Admin -> chup sidebar ben trai mo rong" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\sidebar-admin.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [4] sidebar-doctor.png" -ForegroundColor White
Write-Host "      - Dang nhap Doctor -> chup sidebar ben trai" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\sidebar-doctor.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [5] patient-list.png" -ForegroundColor White
Write-Host "      - Dang nhap Receptionist -> /app/patients" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\patient-list.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [6] visit-create.png" -ForegroundColor White
Write-Host "      - /app/visits/new -> chup form tao luot kham" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\visit-create.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [7] examination-page.png" -ForegroundColor White
Write-Host "      - Dang nhap Doctor -> /app/examinations/<id>" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\examination-page.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [8] invoice-detail.png" -ForegroundColor White
Write-Host "      - Dang nhap Cashier -> /app/invoices/<id>" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\invoice-detail.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [9] pharmacy-worklist.png" -ForegroundColor White
Write-Host "      - Dang nhap Pharmacist -> /app/pharmacy" -ForegroundColor Gray
Write-Host "      - Luu: figures\screenshots\pharmacy-worklist.png" -ForegroundColor Gray
Write-Host ""

Write-Host "NHOM 2 - SWAGGER (can chay backend)" -ForegroundColor Yellow
Write-Host "  URL: http://localhost:3000/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "  [10] swagger-ui.png" -ForegroundColor White
Write-Host "      - Chup toan trang Swagger UI (thu nho browser neu can)" -ForegroundColor Gray
Write-Host "      - Luu: figures\ch04-implementation\swagger-ui.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [11] swagger-visits.png" -ForegroundColor White
Write-Host "      - Swagger -> expand nhom 'visits' -> chup 3-4 endpoint" -ForegroundColor Gray
Write-Host "      - Luu: figures\ch04-implementation\swagger-visits.png" -ForegroundColor Gray
Write-Host ""

Write-Host "NHOM 3 - TEST RESULTS (can chay test)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [12] test-e2e-result.png" -ForegroundColor White
Write-Host "      - cd backend && npx jest --config test/jest-e2e.json --forceExit --runInBand" -ForegroundColor Gray
Write-Host "      - Chup terminal hien thi 'Tests: 220 passed, 220 total'" -ForegroundColor Gray
Write-Host "      - Luu: figures\ch05-testing\test-e2e-result.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [13] test-payment-error.png" -ForegroundColor White
Write-Host "      - Swagger -> POST /api/v1/invoices/{id}/payments" -ForegroundColor Gray
Write-Host "      - Nhap so tien > remaining -> chup response 400" -ForegroundColor Gray
Write-Host "      - Luu: figures\ch05-testing\test-payment-error.png" -ForegroundColor Gray
Write-Host ""

Write-Host "NHOM 4 - DEPLOYMENT" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [14] terminal-backend.png" -ForegroundColor White
Write-Host "      - Chup terminal hien thi 'NestJS listening on port 3000'" -ForegroundColor Gray
Write-Host "      - Luu: figures\ch06-deployment\terminal-backend.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [15] terminal-frontend.png" -ForegroundColor White
Write-Host "      - Chup terminal hien thi 'Local: http://localhost:5173'" -ForegroundColor Gray
Write-Host "      - Luu: figures\ch06-deployment\terminal-frontend.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  [16] prisma-studio.png" -ForegroundColor White
Write-Host "      - cd backend && npx prisma studio" -ForegroundColor Gray
Write-Host "      - Chup bang Visit hoac Patient trong Prisma Studio" -ForegroundColor Gray
Write-Host "      - Luu: figures\ch06-deployment\prisma-studio.png" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  SAU KHI CHUP XONG: Chay lai script de kiem tra" -ForegroundColor Cyan
Write-Host "  .\CAPTURE_SCREENSHOTS.ps1" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
