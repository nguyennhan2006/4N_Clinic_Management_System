import { AppointmentStatus, PrismaClient, QueueStatus, VisitStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function atTime(base: Date, h: number, m = 0): Date {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting comprehensive seed...');

  // ── Step 1: Roles ────────────────────────────────────────────────────────
  const roleDefinitions = [
    { code: 'ADMIN', name: 'Quản trị viên' },
    { code: 'DOCTOR', name: 'Bác sĩ' },
    { code: 'RECEPTIONIST', name: 'Lễ tân' },
    { code: 'CASHIER', name: 'Thu ngân' },
    { code: 'MANAGER', name: 'Quản lý' },
    { code: 'NURSE', name: 'Điều dưỡng' },
    { code: 'LAB_TECHNICIAN', name: 'Kỹ thuật viên xét nghiệm' },
    { code: 'PHARMACIST', name: 'Dược sĩ' },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const rd of roleDefinitions) {
    roles[rd.code] = await prisma.role.upsert({
      where: { code: rd.code },
      update: { name: rd.name },
      create: { code: rd.code, name: rd.name },
    });
  }
  console.log('✓ Roles');

  // ── Step 2: Users ────────────────────────────────────────────────────────
  const userDefs = [
    { username: 'admin',        fullName: 'System Admin',           email: 'admin@clinic.local',        password: 'Admin@123456',      roleCode: 'ADMIN' },
    { username: 'doctor',       fullName: 'BS. Nguyễn Văn Khoa',   email: 'doctor@clinic.local',       password: 'Doctor@123456',     roleCode: 'DOCTOR' },
    { username: 'receptionist', fullName: 'Lễ tân Trần Thị Thu',   email: 'receptionist@clinic.local', password: 'Reception@123456',  roleCode: 'RECEPTIONIST' },
    { username: 'cashier',      fullName: 'Thu ngân Lê Thị Tuyết', email: 'cashier@clinic.local',      password: 'Cashier@123456',    roleCode: 'CASHIER' },
    { username: 'manager',      fullName: 'Quản lý Phạm Hùng',     email: 'manager@clinic.local',      password: 'Manager@123456',    roleCode: 'MANAGER' },
    { username: 'nurse',        fullName: 'Điều dưỡng Hoàng Mai',  email: 'nurse@clinic.local',        password: 'Nurse@123456',      roleCode: 'NURSE' },
    { username: 'labtech',      fullName: 'KTV Nguyễn Hải',        email: 'labtech@clinic.local',      password: 'Labtech@123456',    roleCode: 'LAB_TECHNICIAN' },
    { username: 'pharmacist',   fullName: 'DS. Lý Minh Châu',      email: 'pharmacist@clinic.local',   password: 'Pharma@123456',     roleCode: 'PHARMACIST' },
  ];

  const users: Record<string, { id: string }> = {};
  for (const ud of userDefs) {
    users[ud.username] = await prisma.user.upsert({
      where: { username: ud.username },
      update: {},
      create: {
        username: ud.username,
        fullName: ud.fullName,
        email: ud.email,
        passwordHash: await bcrypt.hash(ud.password, 10),
      },
    });
  }

  for (const ud of userDefs) {
    const userId = users[ud.username].id;
    const roleId = roles[ud.roleCode].id;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }
  console.log('✓ Users & roles assigned');

  // ── Step 3: Permissions ──────────────────────────────────────────────────
  const permDefs = [
    { code: 'USER_READ', name: 'Xem danh sách người dùng' },
    { code: 'USER_CREATE', name: 'Tạo người dùng' },
    { code: 'USER_UPDATE', name: 'Cập nhật thông tin người dùng' },
    { code: 'AUTH_ME', name: 'Xem thông tin tài khoản hiện tại' },
    { code: 'AUDIT_READ', name: 'Xem nhật ký hệ thống' },
  ];
  const perms: Record<string, { id: string }> = {};
  for (const pd of permDefs) {
    perms[pd.code] = await prisma.permission.upsert({
      where: { code: pd.code },
      update: {},
      create: pd,
    });
  }
  for (const perm of Object.values(perms)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles['ADMIN'].id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles['ADMIN'].id, permissionId: perm.id },
    });
  }
  console.log('✓ Permissions');

  // ── Step 4: Drugs catalog (10 items) ────────────────────────────────────
  const drugDefs = [
    { name: 'Paracetamol 500mg',           unit: 'viên',  price: 2000 },
    { name: 'Vitamin C 500mg',             unit: 'viên',  price: 1500 },
    { name: 'Amoxicillin 500mg',           unit: 'viên',  price: 5000 },
    { name: 'Ibuprofen 400mg',             unit: 'viên',  price: 3000 },
    { name: 'ORS (gói bù điện giải)',      unit: 'gói',   price: 8000 },
    { name: 'Cetirizine 10mg',             unit: 'viên',  price: 2500 },
    { name: 'Omeprazole 20mg',             unit: 'viên',  price: 4000 },
    { name: 'Azithromycin 500mg',          unit: 'viên',  price: 15000 },
    { name: 'Metformin 500mg',             unit: 'viên',  price: 1800 },
    { name: 'Amlodipine 5mg',             unit: 'viên',  price: 3500 },
  ];
  for (const d of drugDefs) {
    await prisma.drug.upsert({
      where: { name: d.name },
      update: { price: d.price },
      create: d,
    });
  }
  const allDrugs = await prisma.drug.findMany({ orderBy: { name: 'asc' } });
  const drugByName = new Map(allDrugs.map((d) => [d.name, d]));
  console.log('✓ Drugs catalog (10)');

  // ── Step 5: Diseases catalog ─────────────────────────────────────────────
  const diseaseDefs = [
    { code: 'J00',   name: 'Viêm mũi họng cấp' },
    { code: 'J06.9', name: 'Nhiễm khuẩn hô hấp trên cấp tính' },
    { code: 'J11',   name: 'Cúm do vi rút chưa được nhận diện' },
    { code: 'K21.0', name: 'Trào ngược dạ dày thực quản có viêm thực quản' },
    { code: 'K30',   name: 'Rối loạn tiêu hóa chức năng' },
    { code: 'L30.9', name: 'Viêm da không đặc hiệu' },
    { code: 'M54.5', name: 'Đau thắt lưng' },
    { code: 'R10.4', name: 'Đau bụng không đặc hiệu' },
    { code: 'R51',   name: 'Nhức đầu' },
    { code: 'Z00.0', name: 'Khám sức khỏe định kỳ' },
    { code: 'E11',   name: 'Đái tháo đường type 2' },
    { code: 'I10',   name: 'Tăng huyết áp nguyên phát' },
  ];
  for (const d of diseaseDefs) {
    await prisma.disease.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
  }
  const allDiseases = await prisma.disease.findMany();
  const diseaseByCode = new Map(allDiseases.map((d) => [d.code, d]));
  console.log('✓ Diseases catalog (12)');

  // ── Step 6: Regulation ───────────────────────────────────────────────────
  const hasActive = await prisma.regulationVersion.count({ where: { isActive: true } });
  if (hasActive === 0) {
    await prisma.regulationVersion.create({
      data: {
        isActive: true,
        activatedAt: new Date(),
        note: 'Quy định khởi tạo mặc định',
        items: {
          create: [
            { key: 'MAX_PATIENTS_PER_DAY', value: '40' },
            { key: 'CONSULTATION_FEE', value: '150000' },
          ],
        },
      },
    });
  }
  console.log('✓ Regulation');

  // ── Step 7: Organization ─────────────────────────────────────────────────
  const deptDefs = [
    { code: 'GENERAL', name: 'Nội khoa tổng quát' },
    { code: 'LAB',     name: 'Xét nghiệm' },
    { code: 'PHARMACY', name: 'Nhà thuốc' },
  ];
  const depts: Record<string, { id: string }> = {};
  for (const dd of deptDefs) {
    depts[dd.code] = await prisma.department.upsert({
      where: { code: dd.code },
      update: { name: dd.name },
      create: { code: dd.code, name: dd.name },
    });
  }

  const roomDefs = [
    { deptCode: 'GENERAL', code: 'CONS-01', name: 'Phòng khám 01', roomType: 'CONSULTATION' },
    { deptCode: 'GENERAL', code: 'CONS-02', name: 'Phòng khám 02', roomType: 'CONSULTATION' },
    { deptCode: 'LAB',     code: 'LAB-01',  name: 'Phòng xét nghiệm 01', roomType: 'LAB' },
    { deptCode: 'PHARMACY', code: 'PHARM-01', name: 'Quầy thuốc 01', roomType: 'PHARMACY' },
  ];
  const rooms: Record<string, { id: string }> = {};
  for (const rd of roomDefs) {
    const departmentId = depts[rd.deptCode].id;
    rooms[rd.code] = await prisma.room.upsert({
      where: { departmentId_code: { departmentId, code: rd.code } },
      update: {},
      create: { departmentId, code: rd.code, name: rd.name, roomType: rd.roomType },
    });
  }

  await prisma.doctorProfile.upsert({
    where: { userId: users['doctor'].id },
    update: {},
    create: {
      userId: users['doctor'].id,
      departmentId: depts['GENERAL'].id,
      title: 'BS.',
      specialty: 'Nội khoa tổng quát',
    },
  });
  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: users['doctor'].id } });
  console.log('✓ Organization (depts, rooms, doctor profile)');

  // ── Step 8: Service Catalog + Lab Test Catalog ───────────────────────────
  const serviceDefs = [
    { code: 'CONSULT', name: 'Phí khám bệnh',                    type: 'CONSULTATION' as const, price: 150000 },
    { code: 'CBC',     name: 'Công thức máu toàn phần (CBC)',     type: 'LAB_TEST' as const,    price: 80000 },
    { code: 'URINE',   name: 'Tổng phân tích nước tiểu',         type: 'LAB_TEST' as const,    price: 60000 },
    { code: 'ECHO',    name: 'Siêu âm bụng tổng quát',           type: 'IMAGING' as const,     price: 200000 },
    { code: 'ECG',     name: 'Điện tim (ECG)',                    type: 'PROCEDURE' as const,   price: 100000 },
  ];
  const services: Record<string, { id: string }> = {};
  for (const sd of serviceDefs) {
    services[sd.code] = await prisma.serviceCatalog.upsert({
      where: { code: sd.code },
      update: { name: sd.name, price: sd.price },
      create: { code: sd.code, name: sd.name, type: sd.type, price: sd.price },
    });
  }

  const labTestDefs = [
    { code: 'CBC',   serviceCode: 'CBC',   sampleType: 'BLOOD', turnaroundHours: 4, referenceRange: 'RBC: 4.2-5.4 M/uL; WBC: 4.5-11 K/uL; PLT: 150-400 K/uL' },
    { code: 'URINE', serviceCode: 'URINE', sampleType: 'URINE', turnaroundHours: 2, referenceRange: 'pH 4.5-8.0; Protein: negative; Glucose: negative' },
  ];
  const labTests: Record<string, { id: string }> = {};
  for (const ltd of labTestDefs) {
    labTests[ltd.code] = await prisma.labTestCatalog.upsert({
      where: { code: ltd.code },
      update: {},
      create: {
        code: ltd.code,
        serviceId: services[ltd.serviceCode].id,
        sampleType: ltd.sampleType,
        turnaroundHours: ltd.turnaroundHours,
        referenceRange: ltd.referenceRange,
      },
    });
  }
  console.log('✓ Service catalog + Lab test catalog');

  // ── Step 9: Stock Lots ───────────────────────────────────────────────────
  const lotDefs = [
    { drugName: 'Paracetamol 500mg',      lotNumber: 'LOT-2025-001', qty: 500, expiryDate: new Date('2027-06-30'), unitCost: 1500 },
    { drugName: 'Vitamin C 500mg',        lotNumber: 'LOT-2025-002', qty: 300, expiryDate: new Date('2027-12-31'), unitCost: 1000 },
    { drugName: 'Amoxicillin 500mg',      lotNumber: 'LOT-2025-003', qty: 200, expiryDate: new Date('2026-09-30'), unitCost: 3500 },
    { drugName: 'Ibuprofen 400mg',        lotNumber: 'LOT-2025-004', qty: 150, expiryDate: new Date('2027-03-31'), unitCost: 2000 },
    { drugName: 'ORS (gói bù điện giải)', lotNumber: 'LOT-2025-005', qty: 100, expiryDate: new Date('2026-12-31'), unitCost: 5000 },
    { drugName: 'Cetirizine 10mg',        lotNumber: 'LOT-2025-006', qty: 200, expiryDate: new Date('2027-06-30'), unitCost: 1800 },
    { drugName: 'Omeprazole 20mg',        lotNumber: 'LOT-2025-007', qty: 120, expiryDate: new Date('2026-08-31'), unitCost: 2800 },
    { drugName: 'Azithromycin 500mg',     lotNumber: 'LOT-2025-008', qty: 80,  expiryDate: new Date('2026-06-30'), unitCost: 10000 },
    // Short expiry lot — for testing expiry warning UI
    { drugName: 'Paracetamol 500mg',      lotNumber: 'LOT-2025-OLD', qty: 20,  expiryDate: new Date('2026-06-25'), unitCost: 1200 },
    // Low stock lot — for testing low stock warning
    { drugName: 'Metformin 500mg',        lotNumber: 'LOT-2025-009', qty: 8,   expiryDate: new Date('2027-12-31'), unitCost: 1200 },
    { drugName: 'Amlodipine 5mg',        lotNumber: 'LOT-2025-010', qty: 60,  expiryDate: new Date('2028-06-30'), unitCost: 2500 },
  ];
  const lots: Record<string, { id: string }> = {};
  for (const ld of lotDefs) {
    const drug = drugByName.get(ld.drugName);
    if (!drug) continue;
    const key = `${ld.drugName}-${ld.lotNumber}`;
    lots[key] = await prisma.stockLot.upsert({
      where: { drugId_lotNumber: { drugId: drug.id, lotNumber: ld.lotNumber } },
      update: { quantityOnHand: ld.qty },
      create: {
        drugId: drug.id,
        lotNumber: ld.lotNumber,
        expiryDate: ld.expiryDate,
        quantityOnHand: ld.qty,
        unitCost: ld.unitCost,
      },
    });
  }
  console.log('✓ Stock lots (11 lots, including expiry warning + low stock scenarios)');

  // ── Step 10: Demo Patients ───────────────────────────────────────────────
  const patientDefs = [
    { patientCode: 'BN001', fullName: 'Nguyễn Thị Mai',   gender: 'FEMALE', dob: new Date('1985-03-15'), phone: '0901234001', address: '12 Nguyễn Trãi, Q.1' },
    { patientCode: 'BN002', fullName: 'Trần Văn Hùng',    gender: 'MALE',   dob: new Date('1972-07-22'), phone: '0901234002', address: '45 Lê Lợi, Q.3' },
    { patientCode: 'BN003', fullName: 'Lê Thị Lan',       gender: 'FEMALE', dob: new Date('1995-11-08'), phone: '0901234003', address: '78 Võ Văn Tần, Q.5' },
    { patientCode: 'BN004', fullName: 'Phạm Quốc Bảo',   gender: 'MALE',   dob: new Date('2001-01-30'), phone: '0901234004', address: '9 Đinh Tiên Hoàng, BT' },
    { patientCode: 'BN005', fullName: 'Hoàng Minh Tuấn', gender: 'MALE',   dob: new Date('1960-05-19'), phone: '0901234005', address: '33 CMT8, Q.10' },
    { patientCode: 'BN006', fullName: 'Nguyễn Văn An',   gender: 'MALE',   dob: new Date('1978-09-12'), phone: '0901234006', address: '56 Hai Bà Trưng, Q.1' },
    { patientCode: 'BN007', fullName: 'Trần Thị Hoa',    gender: 'FEMALE', dob: new Date('1990-04-25'), phone: '0901234007', address: '22 Lý Thường Kiệt, Q.10' },
    { patientCode: 'BN008', fullName: 'Lý Văn Đức',      gender: 'MALE',   dob: new Date('1955-12-03'), phone: '0901234008', address: '100 Điện Biên Phủ, BT' },
  ];
  const patients: Record<string, { id: string }> = {};
  for (const pd of patientDefs) {
    patients[pd.patientCode] = await prisma.patient.upsert({
      where: { patientCode: pd.patientCode },
      update: {},
      create: pd,
    });
  }
  console.log('✓ Patients (8)');

  // ── References ────────────────────────────────────────────────────────────
  const doctorId  = users['doctor'].id;
  const nurseId   = users['nurse'].id;
  const labtechId = users['labtech'].id;
  const pharmaId  = users['pharmacist'].id;
  const recepId   = users['receptionist'].id;
  const genDeptId = depts['GENERAL'].id;

  const today      = daysAgo(0);
  const yesterday  = daysAgo(1);
  const days3ago   = daysAgo(3);
  const days7ago   = daysAgo(7);
  const days14ago  = daysAgo(14);
  const days21ago  = daysAgo(21);

  // Helper: upsert a visit and return it
  async function upsertVisit(opts: {
    patientCode: string;
    visitDate: Date;
    queueNumber: number;
    status: string;
    reason: string;
  }) {
    return prisma.visit.upsert({
      where: {
        patientId_visitDate: {
          patientId: patients[opts.patientCode].id,
          visitDate: opts.visitDate,
        },
      },
      update: {},
      create: {
        patientId: patients[opts.patientCode].id,
        visitDate: opts.visitDate,
        queueNumber: opts.queueNumber,
        status: opts.status as VisitStatus,
        reason: opts.reason,
        createdByUserId: recepId,
      },
    });
  }

  // ── Step 11: TODAY's visits ──────────────────────────────────────────────
  //
  // BN001 q1 WAITING          — vitals taken, queued, ready for doctor
  // BN002 q2 IN_EXAMINATION   — OPEN exam, partial data only (no diagnosis yet), lab ordered
  // BN003 q3 IN_EXAMINATION   — OPEN exam, fully filled, ready to complete
  // BN004 q4 WAITING          — newly arrived, no vitals
  // BN005 q5 WAITING          — newly arrived, no vitals
  // BN006 q6 COMPLETED        — exam done, invoice DRAFT (cashier needs to issue)

  const vToday = {
    BN001: await upsertVisit({ patientCode: 'BN001', visitDate: today, queueNumber: 1, status: 'WAITING',        reason: 'Sốt, ho, đau họng 3 ngày' }),
    BN002: await upsertVisit({ patientCode: 'BN002', visitDate: today, queueNumber: 2, status: 'IN_EXAMINATION', reason: 'Đau lưng mãn tính, tê bì chân' }),
    BN003: await upsertVisit({ patientCode: 'BN003', visitDate: today, queueNumber: 3, status: 'IN_EXAMINATION', reason: 'Dị ứng da, nổi mề đay' }),
    BN004: await upsertVisit({ patientCode: 'BN004', visitDate: today, queueNumber: 4, status: 'WAITING',        reason: 'Đau đầu kéo dài, chóng mặt' }),
    BN005: await upsertVisit({ patientCode: 'BN005', visitDate: today, queueNumber: 5, status: 'WAITING',        reason: 'Buồn nôn, đau bụng sau ăn' }),
    BN006: await upsertVisit({ patientCode: 'BN006', visitDate: today, queueNumber: 6, status: 'COMPLETED',      reason: 'Tái khám tăng huyết áp' }),
  };

  // VitalSigns — BN001 và BN003 đã đo
  for (const [code, data] of [
    ['BN001', { pulse: 88, systolicBp: 118, diastolicBp: 75, temperature: 38.2, spo2: 98, heightCm: 162, weightKg: 58.0, bmi: 22.1, note: 'Đo lúc 8:15 SA' }],
    ['BN003', { pulse: 76, systolicBp: 110, diastolicBp: 70, temperature: 36.8, spo2: 99, heightCm: 155, weightKg: 52.0, bmi: 21.6, note: null }],
  ] as [string, { pulse: number; systolicBp: number; diastolicBp: number; temperature: number; spo2: number; heightCm: number; weightKg: number; bmi: number; note: string | null }][]) {
    const visit = vToday[code as keyof typeof vToday];
    const existing = await prisma.vitalSign.findUnique({ where: { visitId: visit.id } });
    if (!existing) {
      await prisma.vitalSign.create({
        data: {
          visitId: visit.id,
          measuredById: nurseId,
          ...data,
        },
      });
    }
  }

  // QueueTickets for today — WAITING patients in queue
  for (const [code, qn, status] of [
    ['BN001', 1, 'WAITING'],
    ['BN002', 2, 'DONE'],
    ['BN003', 3, 'DONE'],
    ['BN004', 4, 'WAITING'],
    ['BN005', 5, 'WAITING'],
  ] as [string, number, string][]) {
    const visit = vToday[code as keyof typeof vToday];
    const existing = await prisma.queueTicket.findUnique({ where: { visitId: visit.id } });
    if (!existing) {
      await prisma.queueTicket.create({
        data: {
          visitId: visit.id,
          departmentId: genDeptId,
          queueDate: today,
          queueNumber: qn,
          status: status as QueueStatus,
          calledAt: status === 'DONE' ? atTime(today, 8, 30) : null,
          completedAt: status === 'DONE' ? atTime(today, 9, 0) : null,
        },
      });
    }
  }

  // Examination for BN002 — OPEN, partial (no diagnosis, no conclusion yet)
  let examBN002 = await prisma.examination.findUnique({ where: { visitId: vToday.BN002.id } });
  if (!examBN002) {
    examBN002 = await prisma.examination.create({
      data: {
        visitId: vToday.BN002.id,
        doctorUserId: doctorId,
        status: 'OPEN',
        symptoms: 'Đau vùng thắt lưng L4-L5, lan xuống mặt sau đùi trái. Tê bì ngón chân. Đau tăng khi ngồi lâu, giảm khi nằm.',
        clinicalNotes: 'Cột sống thắt lưng: đau khi ấn vào L4-L5. Dấu Lasègue (+) bên trái 45°. Phản xạ gân xương bình thường.',
      },
    });
  }

  // ServiceOrder CBC cho BN002 — lab chưa lấy mẫu
  const existingSO_BN002 = await prisma.serviceOrder.findFirst({
    where: { visitId: vToday.BN002.id, serviceId: services['CBC'].id },
  });
  let soBN002 = existingSO_BN002;
  if (!soBN002) {
    soBN002 = await prisma.serviceOrder.create({
      data: {
        visitId: vToday.BN002.id,
        examinationId: examBN002.id,
        serviceId: services['CBC'].id,
        orderedById: doctorId,
        status: 'ORDERED',
        isRequired: false,
        priceSnapshot: 80000,
      },
    });
    // LabOrder cho service order này
    await prisma.labOrder.create({
      data: {
        serviceOrderId: soBN002.id,
        labTestId: labTests['CBC'].id,
        status: 'ORDERED',
      },
    });
  }

  // Examination for BN003 — OPEN, đã đủ thông tin, sẵn sàng Complete
  let examBN003 = await prisma.examination.findUnique({ where: { visitId: vToday.BN003.id } });
  if (!examBN003) {
    examBN003 = await prisma.examination.create({
      data: {
        visitId: vToday.BN003.id,
        doctorUserId: doctorId,
        status: 'OPEN',
        symptoms: 'Nổi mề đay toàn thân, ngứa dữ dội, xuất hiện sau khi ăn hải sản tối qua. Không khó thở.',
        clinicalNotes: 'Da: nổi sẩn đỏ, phù nề, phân bố rải rác toàn thân. Không phù mặt, không thở rít. Sinh hiệu ổn.',
        conclusion: 'Mề đay cấp do dị ứng thực phẩm. Cần tránh hải sản và các thực phẩm gây dị ứng.',
      },
    });
  }

  // Diagnosis for BN003
  const existingDiag3 = await prisma.diagnosis.findFirst({ where: { examinationId: examBN003.id } });
  if (!existingDiag3) {
    const d = diseaseByCode.get('L30.9')!;
    await prisma.diagnosis.create({
      data: { examinationId: examBN003.id, diseaseId: d.id, name: d.name, isPrimary: true },
    });
  }

  // Prescription for BN003
  const existingRx3 = await prisma.prescription.findUnique({ where: { examinationId: examBN003.id } });
  if (!existingRx3) {
    const cetirizine = drugByName.get('Cetirizine 10mg')!;
    const para = drugByName.get('Paracetamol 500mg')!;
    await prisma.prescription.create({
      data: {
        examinationId: examBN003.id,
        note: 'Uống thuốc đúng giờ. Tái khám ngay nếu khó thở.',
        items: {
          create: [
            { drugId: cetirizine.id, quantity: 10, dosage: '1 viên/ngày trước khi ngủ', unitPrice: 2500, lineTotal: 25000 },
            { drugId: para.id,       quantity: 10, dosage: '1 viên khi sốt/đau, tối đa 3 lần/ngày', unitPrice: 2000, lineTotal: 20000 },
          ],
        },
      },
    });
  }

  // Examination for BN006 today — COMPLETED (tái khám THA)
  let examBN006today = await prisma.examination.findUnique({ where: { visitId: vToday.BN006.id } });
  if (!examBN006today) {
    examBN006today = await prisma.examination.create({
      data: {
        visitId: vToday.BN006.id,
        doctorUserId: doctorId,
        status: 'COMPLETED',
        symptoms: 'Đau đầu nhẹ vùng chẩm. HA đo tại nhà 140/90 mmHg. Không tức ngực, không khó thở.',
        clinicalNotes: 'HA đo: 138/88 mmHg. Tim đều, không tiếng thổi. Phổi trong.',
        conclusion: 'Tăng huyết áp grade 1 có kiểm soát. Tiếp tục thuốc cũ, điều chỉnh lối sống.',
        completedAt: atTime(today, 10, 30),
      },
    });
    const diag_i10 = diseaseByCode.get('I10')!;
    await prisma.diagnosis.create({
      data: { examinationId: examBN006today.id, diseaseId: diag_i10.id, name: diag_i10.name, isPrimary: true },
    });
    const amlodipine = drugByName.get('Amlodipine 5mg')!;
    await prisma.prescription.create({
      data: {
        examinationId: examBN006today.id,
        note: 'Uống sáng sau ăn. Đo HA tại nhà hàng ngày.',
        items: {
          create: [
            { drugId: amlodipine.id, quantity: 30, dosage: '1 viên/ngày buổi sáng', unitPrice: 3500, lineTotal: 105000 },
          ],
        },
      },
    });
  }

  // Invoice DRAFT cho BN006 today
  const existingInv6today = await prisma.invoice.findUnique({ where: { visitId: vToday.BN006.id } });
  if (!existingInv6today) {
    await prisma.invoice.create({
      data: {
        visitId: vToday.BN006.id,
        totalAmount: 255000, // 150k khám + 105k thuốc
        paidAmount: 0,
        status: 'DRAFT',
        items: {
          create: [
            { description: 'Phí khám bệnh', quantity: 1, unitPrice: 150000, lineTotal: 150000, itemType: 'CONSULTATION' },
            { description: 'Amlodipine 5mg x30', quantity: 30, unitPrice: 3500, lineTotal: 105000, itemType: 'DRUG', referenceType: 'Drug' },
          ],
        },
      },
    });
  }

  console.log('✓ Today visits (6): WAITING x3, IN_EXAMINATION x2 (1 partial, 1 ready-to-complete), COMPLETED x1');

  // ── Step 12: YESTERDAY's visits ─────────────────────────────────────────
  //
  // BN007 q1 COMPLETED — invoice ISSUED (chưa thanh toán)
  // BN008 q2 COMPLETED — invoice PARTIALLY_PAID (còn lại 150k)
  // BN004 q3 COMPLETED — completed earlier today (for history)

  const vYesterday = {
    BN007: await upsertVisit({ patientCode: 'BN007', visitDate: yesterday, queueNumber: 1, status: 'COMPLETED', reason: 'Đau bụng, đầy hơi sau ăn, ợ hơi nhiều' }),
    BN008: await upsertVisit({ patientCode: 'BN008', visitDate: yesterday, queueNumber: 2, status: 'COMPLETED', reason: 'Tiểu đường type 2 tái khám định kỳ' }),
  };

  // BN007 yesterday — exam COMPLETED, invoice ISSUED (ready for payment, UC-15 test)
  let examBN007y = await prisma.examination.findUnique({ where: { visitId: vYesterday.BN007.id } });
  if (!examBN007y) {
    examBN007y = await prisma.examination.create({
      data: {
        visitId: vYesterday.BN007.id,
        doctorUserId: doctorId,
        status: 'COMPLETED',
        symptoms: 'Đau bụng trên rốn, nóng rát sau ăn 30 phút. Ợ chua nhiều. Kéo dài 2 tuần.',
        clinicalNotes: 'Bụng mềm, ấn đau nhẹ vùng thượng vị. Không có phản ứng phúc mạc.',
        conclusion: 'Trào ngược dạ dày thực quản. Điều trị PPI + thay đổi chế độ ăn.',
        completedAt: atTime(yesterday, 10, 0),
      },
    });
    const diag_k21 = diseaseByCode.get('K21.0')!;
    await prisma.diagnosis.create({
      data: { examinationId: examBN007y.id, diseaseId: diag_k21.id, name: diag_k21.name, isPrimary: true },
    });
    const diag_k30 = diseaseByCode.get('K30')!;
    await prisma.diagnosis.create({
      data: { examinationId: examBN007y.id, diseaseId: diag_k30.id, name: diag_k30.name, isPrimary: false },
    });
    const omeprazole = drugByName.get('Omeprazole 20mg')!;
    const ors = drugByName.get('ORS (gói bù điện giải)')!;
    await prisma.prescription.create({
      data: {
        examinationId: examBN007y.id,
        note: 'Uống Omeprazole 30 phút trước ăn. Không nằm sau ăn. Ăn nhiều bữa nhỏ.',
        items: {
          create: [
            { drugId: omeprazole.id, quantity: 14, dosage: '1 viên/ngày trước ăn sáng', unitPrice: 4000, lineTotal: 56000 },
            { drugId: ors.id,        quantity: 5,  dosage: '1 gói/ngày pha với 200ml nước', unitPrice: 8000, lineTotal: 40000 },
          ],
        },
      },
    });
  }

  const existingInv7y = await prisma.invoice.findUnique({ where: { visitId: vYesterday.BN007.id } });
  if (!existingInv7y) {
    // ISSUED — thể hiện UC-15 cần thanh toán
    await prisma.invoice.create({
      data: {
        visitId: vYesterday.BN007.id,
        totalAmount: 246000, // 150k + 56k + 40k
        paidAmount: 0,
        status: 'ISSUED',
        items: {
          create: [
            { description: 'Phí khám bệnh', quantity: 1, unitPrice: 150000, lineTotal: 150000, itemType: 'CONSULTATION' },
            { description: 'Omeprazole 20mg x14', quantity: 14, unitPrice: 4000, lineTotal: 56000, itemType: 'DRUG' },
            { description: 'ORS x5 gói', quantity: 5, unitPrice: 8000, lineTotal: 40000, itemType: 'DRUG' },
          ],
        },
      },
    });
  }

  // BN008 yesterday — exam COMPLETED, invoice PARTIALLY_PAID
  let examBN008y = await prisma.examination.findUnique({ where: { visitId: vYesterday.BN008.id } });
  if (!examBN008y) {
    examBN008y = await prisma.examination.create({
      data: {
        visitId: vYesterday.BN008.id,
        doctorUserId: doctorId,
        status: 'COMPLETED',
        symptoms: 'Mệt mỏi, uống nhiều nước, tiểu nhiều. Đường huyết lúc đói 8.5 mmol/L (đo tại nhà).',
        clinicalNotes: 'HbA1c cần theo dõi. BMI 26.5. Không biến chứng thần kinh ngoại vi rõ.',
        conclusion: 'Đái tháo đường type 2 chưa kiểm soát tốt. Tăng liều Metformin. Chế độ ăn kiêng đường.',
        completedAt: atTime(yesterday, 14, 0),
      },
    });
    const diag_e11 = diseaseByCode.get('E11')!;
    await prisma.diagnosis.create({
      data: { examinationId: examBN008y.id, diseaseId: diag_e11.id, name: diag_e11.name, isPrimary: true },
    });
    const metformin = drugByName.get('Metformin 500mg')!;
    await prisma.prescription.create({
      data: {
        examinationId: examBN008y.id,
        note: 'Uống sau ăn để giảm tác dụng phụ tiêu hóa. Theo dõi đường huyết 2 lần/ngày.',
        items: {
          create: [
            { drugId: metformin.id, quantity: 30, dosage: '1 viên x 2 lần/ngày sau ăn sáng và tối', unitPrice: 1800, lineTotal: 54000 },
          ],
        },
      },
    });
  }

  const existingInv8y = await prisma.invoice.findUnique({ where: { visitId: vYesterday.BN008.id } });
  if (!existingInv8y) {
    const inv8 = await prisma.invoice.create({
      data: {
        visitId: vYesterday.BN008.id,
        totalAmount: 204000, // 150k + 54k
        paidAmount: 100000,
        status: 'PARTIALLY_PAID',
        items: {
          create: [
            { description: 'Phí khám bệnh', quantity: 1, unitPrice: 150000, lineTotal: 150000, itemType: 'CONSULTATION' },
            { description: 'Metformin 500mg x30', quantity: 30, unitPrice: 1800, lineTotal: 54000, itemType: 'DRUG' },
          ],
        },
      },
    });
    await prisma.payment.create({
      data: { invoiceId: inv8.id, amount: 100000, method: 'CASH', note: 'Thanh toán một phần', paidAt: atTime(yesterday, 14, 30) },
    });
  }

  console.log('✓ Yesterday visits (2): invoice ISSUED + invoice PARTIALLY_PAID');

  // ── Step 13: 3 days ago — COMPLETED + PAID + Dispense ───────────────────
  //
  // BN001 — đây cũng là case có dispense hoàn tất (UC pharmacy)

  const v3BN001 = await upsertVisit({ patientCode: 'BN001', visitDate: days3ago, queueNumber: 1, status: 'COMPLETED', reason: 'Sốt cao 39°C, ho đàm vàng 5 ngày' });

  let exam3BN001 = await prisma.examination.findUnique({ where: { visitId: v3BN001.id } });
  if (!exam3BN001) {
    exam3BN001 = await prisma.examination.create({
      data: {
        visitId: v3BN001.id,
        doctorUserId: doctorId,
        status: 'COMPLETED',
        symptoms: 'Sốt cao 39-40°C, ho đàm vàng xanh, mệt mỏi, chán ăn. Kéo dài 5 ngày không giảm.',
        clinicalNotes: 'Nhiệt độ 38.8°C. Phổi: rì rào phế nang giảm nhẹ bên phải, không rale. X-quang phổi bình thường.',
        conclusion: 'Viêm phế quản cấp do vi khuẩn. Điều trị kháng sinh + hạ sốt + bù điện giải.',
        completedAt: atTime(days3ago, 9, 0),
      },
    });
    const diag_j069 = diseaseByCode.get('J06.9')!;
    await prisma.diagnosis.create({
      data: { examinationId: exam3BN001.id, diseaseId: diag_j069.id, name: diag_j069.name, isPrimary: true },
    });
    const amox = drugByName.get('Amoxicillin 500mg')!;
    const para = drugByName.get('Paracetamol 500mg')!;
    const ors = drugByName.get('ORS (gói bù điện giải)')!;
    const rx3 = await prisma.prescription.create({
      data: {
        examinationId: exam3BN001.id,
        note: 'Uống đủ kháng sinh theo liệu trình 7 ngày. Uống nhiều nước. Tái khám nếu sốt không giảm.',
        items: {
          create: [
            { drugId: amox.id, quantity: 14, dosage: '1 viên x 2 lần/ngày sau ăn', unitPrice: 5000, lineTotal: 70000 },
            { drugId: para.id, quantity: 10, dosage: '1 viên khi sốt trên 38.5°C', unitPrice: 2000, lineTotal: 20000 },
            { drugId: ors.id,  quantity: 5,  dosage: '1 gói/ngày', unitPrice: 8000, lineTotal: 40000 },
          ],
        },
      },
    });

    // Invoice PAID
    const inv3 = await prisma.invoice.create({
      data: {
        visitId: v3BN001.id,
        totalAmount: 280000, // 150k + 70k + 20k + 40k
        paidAmount: 280000,
        status: 'PAID',
        items: {
          create: [
            { description: 'Phí khám bệnh', quantity: 1, unitPrice: 150000, lineTotal: 150000, itemType: 'CONSULTATION' },
            { description: 'Amoxicillin 500mg x14', quantity: 14, unitPrice: 5000, lineTotal: 70000, itemType: 'DRUG' },
            { description: 'Paracetamol 500mg x10', quantity: 10, unitPrice: 2000, lineTotal: 20000, itemType: 'DRUG' },
            { description: 'ORS x5 gói', quantity: 5, unitPrice: 8000, lineTotal: 40000, itemType: 'DRUG' },
          ],
        },
      },
    });
    await prisma.payment.create({
      data: { invoiceId: inv3.id, amount: 280000, method: 'CASH', paidAt: atTime(days3ago, 10, 0) },
    });

    // Dispense DISPENSED — phát thuốc hoàn tất
    const rxItems = await prisma.prescriptionItem.findMany({ where: { prescriptionId: rx3.id }, include: { drug: true } });
    const amoxLot  = await prisma.stockLot.findFirst({ where: { drugId: amox.id, lotNumber: 'LOT-2025-003' } });
    const paraLot  = await prisma.stockLot.findFirst({ where: { drugId: para.id, lotNumber: 'LOT-2025-001' } });
    const orsLot   = await prisma.stockLot.findFirst({ where: { drugId: ors.id,  lotNumber: 'LOT-2025-005' } });

    if (amoxLot && paraLot && orsLot) {
      const dispense = await prisma.dispense.create({
        data: {
          prescriptionId: rx3.id,
          visitId: v3BN001.id,
          dispensedById: pharmaId,
          status: 'DISPENSED',
          dispensedAt: atTime(days3ago, 10, 15),
          note: 'Phát đủ đơn thuốc. Hướng dẫn bệnh nhân cách dùng.',
        },
      });

      for (const item of rxItems) {
        let lot = paraLot;
        if (item.drugId === amox.id) lot = amoxLot;
        if (item.drugId === ors.id) lot = orsLot;
        await prisma.dispenseItem.create({
          data: {
            dispenseId: dispense.id,
            prescriptionItemId: item.id,
            drugId: item.drugId,
            lotId: lot.id,
            quantity: item.quantity,
            unitPriceSnapshot: item.unitPrice,
          },
        });
      }
    }
  }

  // Lab flow hoàn tất cho BN001 — 3 days ago, CBC order VERIFIED
  const existingSO3 = await prisma.serviceOrder.findFirst({ where: { visitId: v3BN001.id, serviceId: services['CBC'].id } });
  if (!existingSO3 && exam3BN001) {
    const so3 = await prisma.serviceOrder.create({
      data: {
        visitId: v3BN001.id,
        examinationId: exam3BN001.id,
        serviceId: services['CBC'].id,
        orderedById: doctorId,
        status: 'COMPLETED',
        isRequired: false,
        priceSnapshot: 80000,
        billingStatus: 'BILLED',
      },
    });
    const lo3 = await prisma.labOrder.create({
      data: { serviceOrderId: so3.id, labTestId: labTests['CBC'].id, status: 'VERIFIED' },
    });
    await prisma.labSample.create({
      data: { labOrderId: lo3.id, collectedById: nurseId, sampleType: 'BLOOD', status: 'COLLECTED', collectedAt: atTime(days3ago, 8, 0) },
    });
    await prisma.labResult.create({
      data: {
        labOrderId: lo3.id,
        enteredById: labtechId,
        verifiedById: doctorId,
        resultText: 'RBC: 4.8 M/uL, WBC: 11.2 K/uL (tăng nhẹ), PLT: 220 K/uL, Hgb: 13.5 g/dL',
        status: 'VERIFIED',
        enteredAt: atTime(days3ago, 9, 0),
        verifiedAt: atTime(days3ago, 9, 30),
      },
    });
  }

  console.log('✓ 3 days ago: visit PAID + dispense DISPENSED + lab VERIFIED');

  // ── Step 14: Historical visits for monthly report ────────────────────────
  // Tạo thêm visit để báo cáo tháng có dữ liệu đẹp

  const historicalVisits = [
    { code: 'BN002', date: days7ago,  q: 1, reason: 'Khám sức khỏe định kỳ',        disease: 'Z00.0', drugs: [{ name: 'Vitamin C 500mg', qty: 30, dosage: '1 viên/ngày', price: 1500 }], total: 195000 },
    { code: 'BN003', date: days7ago,  q: 2, reason: 'Đau đầu, mất ngủ',             disease: 'R51',   drugs: [{ name: 'Paracetamol 500mg', qty: 10, dosage: '1 viên khi đau', price: 2000 }], total: 170000 },
    { code: 'BN004', date: days14ago, q: 1, reason: 'Ho khan, sổ mũi, đau họng',    disease: 'J00',   drugs: [{ name: 'Cetirizine 10mg', qty: 7, dosage: '1 viên/ngày tối', price: 2500 }, { name: 'Paracetamol 500mg', qty: 10, dosage: '1 viên khi sốt', price: 2000 }], total: 187500 },
    { code: 'BN005', date: days14ago, q: 2, reason: 'Đau bụng, tiêu chảy',          disease: 'K30',   drugs: [{ name: 'ORS (gói bù điện giải)', qty: 10, dosage: '1 gói/ngày', price: 8000 }], total: 230000 },
    { code: 'BN006', date: days21ago, q: 1, reason: 'Tăng huyết áp tái khám',       disease: 'I10',   drugs: [{ name: 'Amlodipine 5mg', qty: 30, dosage: '1 viên/ngày sáng', price: 3500 }], total: 255000 },
    { code: 'BN007', date: days21ago, q: 2, reason: 'Dị ứng thời tiết, nổi mẩn',   disease: 'L30.9', drugs: [{ name: 'Cetirizine 10mg', qty: 14, dosage: '1 viên/ngày', price: 2500 }], total: 185000 },
    { code: 'BN008', date: days21ago, q: 3, reason: 'Tiểu đường tái khám',          disease: 'E11',   drugs: [{ name: 'Metformin 500mg', qty: 30, dosage: '1 viên x2 lần/ngày', price: 1800 }], total: 204000 },
  ];

  for (const hv of historicalVisits) {
    const v = await upsertVisit({ patientCode: hv.code, visitDate: hv.date, queueNumber: hv.q, status: 'COMPLETED', reason: hv.reason });
    let ex = await prisma.examination.findUnique({ where: { visitId: v.id } });
    if (!ex) {
      ex = await prisma.examination.create({
        data: {
          visitId: v.id,
          doctorUserId: doctorId,
          status: 'COMPLETED',
          symptoms: hv.reason,
          conclusion: 'Điều trị theo phác đồ. Tái khám khi cần.',
          completedAt: atTime(hv.date, 10, 0),
        },
      });
      const disease = diseaseByCode.get(hv.disease)!;
      await prisma.diagnosis.create({
        data: { examinationId: ex.id, diseaseId: disease.id, name: disease.name, isPrimary: true },
      });
      const rxItems = hv.drugs.map((d) => {
        const drug = drugByName.get(d.name)!;
        return { drugId: drug.id, quantity: d.qty, dosage: d.dosage, unitPrice: d.price, lineTotal: d.price * d.qty };
      });
      await prisma.prescription.create({
        data: { examinationId: ex.id, items: { create: rxItems } },
      });
    }

    const existingInv = await prisma.invoice.findUnique({ where: { visitId: v.id } });
    if (!existingInv) {
      const inv = await prisma.invoice.create({
        data: {
          visitId: v.id,
          totalAmount: hv.total,
          paidAmount: hv.total,
          status: 'PAID',
          items: {
            create: [
              { description: 'Phí khám bệnh', quantity: 1, unitPrice: 150000, lineTotal: 150000, itemType: 'CONSULTATION' },
              ...hv.drugs.map((d) => ({
                description: `${d.name} x${d.qty}`,
                quantity: d.qty,
                unitPrice: d.price,
                lineTotal: d.price * d.qty,
                itemType: 'DRUG',
              })),
            ],
          },
        },
      });
      await prisma.payment.create({
        data: { invoiceId: inv.id, amount: hv.total, method: 'CASH', paidAt: atTime(hv.date, 11, 0) },
      });
    }
  }

  console.log('✓ Historical visits (7) for monthly report data');

  // ── Step 15: Appointments ────────────────────────────────────────────────
  if (!doctorProfile) { console.log('⚠ No doctor profile — skipping appointments'); }
  else {
    const aptDefs = [
      {
        patientCode: 'BN001',
        scheduledAt: atTime(daysFromNow(1), 9, 0),
        reason: 'Tái khám sau điều trị viêm phế quản',
        status: 'SCHEDULED',
        duration: 30,
      },
      {
        patientCode: 'BN004',
        scheduledAt: atTime(daysFromNow(1), 10, 30),
        reason: 'Khám đau đầu mãn tính',
        status: 'SCHEDULED',
        duration: 30,
      },
      {
        patientCode: 'BN003',
        scheduledAt: atTime(daysFromNow(3), 9, 0),
        reason: 'Tái khám dị ứng da',
        status: 'SCHEDULED',
        duration: 15,
      },
      {
        patientCode: 'BN006',
        scheduledAt: atTime(daysFromNow(7), 8, 0),
        reason: 'Kiểm tra huyết áp định kỳ',
        status: 'SCHEDULED',
        duration: 15,
      },
      {
        patientCode: 'BN002',
        scheduledAt: atTime(yesterday, 14, 0),
        reason: 'Khám lưng, chờ kết quả MRI',
        status: 'CHECKED_IN',
        duration: 45,
      },
      {
        patientCode: 'BN007',
        scheduledAt: atTime(days7ago, 10, 0),
        reason: 'Khám dạ dày ban đầu',
        status: 'CHECKED_IN',
        duration: 30,
      },
      {
        patientCode: 'BN005',
        scheduledAt: atTime(daysFromNow(2), 11, 0),
        reason: 'Khám tiêu hóa',
        status: 'CANCELLED',
        duration: 30,
      },
    ];

    for (const ad of aptDefs) {
      const existing = await prisma.appointment.findFirst({
        where: {
          patientId: patients[ad.patientCode].id,
          scheduledAt: ad.scheduledAt,
        },
      });
      if (!existing) {
        await prisma.appointment.create({
          data: {
            patientId: patients[ad.patientCode].id,
            doctorProfileId: doctorProfile.id,
            departmentId: genDeptId,
            scheduledAt: ad.scheduledAt,
            durationMinutes: ad.duration,
            status: ad.status as AppointmentStatus,
            reason: ad.reason,
            createdById: recepId,
          },
        });
      }
    }
  }
  console.log('✓ Appointments (7): 4 SCHEDULED, 2 CHECKED_IN, 1 CANCELLED');

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' SEED COMPLETED — Evaluation data summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('USERS (login credentials):');
  console.log('  admin@clinic.local       / Admin@123456     → ADMIN');
  console.log('  doctor@clinic.local      / Doctor@123456    → DOCTOR');
  console.log('  receptionist@clinic.local/ Reception@123456 → RECEPTIONIST');
  console.log('  cashier@clinic.local     / Cashier@123456   → CASHIER');
  console.log('  manager@clinic.local     / Manager@123456   → MANAGER');
  console.log('  nurse@clinic.local       / Nurse@123456     → NURSE');
  console.log('  labtech@clinic.local     / Labtech@123456   → LAB_TECHNICIAN');
  console.log('  pharmacist@clinic.local  / Pharma@123456    → PHARMACIST');
  console.log('');
  console.log('EVALUATION SCENARIOS:');
  console.log('  UC-07 Create visit   → Login RECEPTIONIST, add BN00x for today');
  console.log('  UC-09 Open exam      → Login DOCTOR → Visits → BN001 "Mở khám"');
  console.log('  UC-10 Fill exam      → BN002 has OPEN exam, partial content');
  console.log('  UC-13 Complete exam  → BN003 ready to complete (all fields filled)');
  console.log('  UC-14 Issue invoice  → BN006 today has DRAFT invoice');
  console.log('  UC-15 Pay invoice    → BN007 yesterday has ISSUED invoice (unpaid)');
  console.log('  UC-16 Invoice search → BN008 yesterday has PARTIALLY_PAID invoice');
  console.log('  Lab worklist         → BN002 has CBC order in ORDERED state');
  console.log('  Lab history          → BN001 3-days-ago has VERIFIED CBC result');
  console.log('  Pharmacy worklist    → BN001 3-days-ago has DISPENSED record');
  console.log('  Inventory            → LOT-2025-OLD: expiry warning; Metformin: low stock');
  console.log('  Appointments         → 4 upcoming, 2 checked-in, 1 cancelled');
  console.log('  Monthly report       → 16 total visits this month with PAID invoices');
  console.log('');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
