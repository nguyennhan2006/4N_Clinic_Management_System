import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // ─── Step 1: Create Roles ──────────────────────────────────────────────────
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
  console.log('✓ Roles created');

  // ─── Step 2: Create Seed Users ─────────────────────────────────────────────
  const userDefinitions = [
    {
      username: 'admin',
      fullName: 'System Admin',
      email: 'admin@clinic.local',
      password: 'Admin@123456',
      roleCode: 'ADMIN',
    },
    {
      username: 'doctor',
      fullName: 'Bác sĩ Demo',
      email: 'doctor@clinic.local',
      password: 'Doctor@123456',
      roleCode: 'DOCTOR',
    },
    {
      username: 'receptionist',
      fullName: 'Lễ tân Demo',
      email: 'receptionist@clinic.local',
      password: 'Reception@123456',
      roleCode: 'RECEPTIONIST',
    },
    {
      username: 'cashier',
      fullName: 'Thu ngân Demo',
      email: 'cashier@clinic.local',
      password: 'Cashier@123456',
      roleCode: 'CASHIER',
    },
    {
      username: 'manager',
      fullName: 'Quản lý Demo',
      email: 'manager@clinic.local',
      password: 'Manager@123456',
      roleCode: 'MANAGER',
    },
    {
      username: 'nurse',
      fullName: 'Điều dưỡng Demo',
      email: 'nurse@clinic.local',
      password: 'Nurse@123456',
      roleCode: 'NURSE',
    },
    {
      username: 'labtech',
      fullName: 'Kỹ thuật viên Demo',
      email: 'labtech@clinic.local',
      password: 'Labtech@123456',
      roleCode: 'LAB_TECHNICIAN',
    },
    {
      username: 'pharmacist',
      fullName: 'Dược sĩ Demo',
      email: 'pharmacist@clinic.local',
      password: 'Pharma@123456',
      roleCode: 'PHARMACIST',
    },
  ];

  const users: Record<string, { id: string }> = {};
  for (const ud of userDefinitions) {
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
  console.log('✓ Users created');

  // ─── Step 3: Assign Roles to Users ─────────────────────────────────────────
  for (const ud of userDefinitions) {
    const userId = users[ud.username].id;
    const roleId = roles[ud.roleCode].id;

    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId, roleId },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });
  }
  console.log('✓ Roles assigned to users');

  // ─── Step 4: Create Permissions ────────────────────────────────────────────
  const permissionDefinitions = [
    { code: 'USER_READ', name: 'Xem danh sách người dùng' },
    { code: 'USER_CREATE', name: 'Tạo người dùng' },
    { code: 'USER_UPDATE', name: 'Cập nhật thông tin người dùng' },
    { code: 'AUTH_ME', name: 'Xem thông tin tài khoản hiện tại' },
    { code: 'AUDIT_READ', name: 'Xem nhật ký hệ thống' },
  ];

  const perms: Record<string, { id: string }> = {};
  for (const pd of permissionDefinitions) {
    perms[pd.code] = await prisma.permission.upsert({
      where: { code: pd.code },
      update: {},
      create: pd,
    });
  }
  console.log('✓ Permissions created');

  // ─── Step 5: Assign Permissions to Admin Role ──────────────────────────────
  const adminRoleId = roles['ADMIN'].id;
  for (const perm of Object.values(perms)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRoleId, permissionId: perm.id },
      },
      update: {},
      create: {
        roleId: adminRoleId,
        permissionId: perm.id,
      },
    });
  }
  console.log('✓ Permissions assigned to ADMIN role');

  // ─── Step 6: Create Drugs Catalog ─────────────────────────────────────────
  const drugs = [
    { name: 'Paracetamol 500mg', unit: 'viên', price: 2000 },
    { name: 'Vitamin C 500mg', unit: 'viên', price: 1500 },
    { name: 'Amoxicillin 500mg', unit: 'viên', price: 5000 },
    { name: 'Ibuprofen 400mg', unit: 'viên', price: 3000 },
    { name: 'ORS (gói bù điện giải)', unit: 'gói', price: 8000 },
  ];

  for (const drug of drugs) {
    await prisma.drug.upsert({
      where: { name: drug.name },
      update: { price: drug.price },
      create: drug,
    });
  }
  console.log('✓ Drugs created');

  // ─── Step 7: Create Disease Catalog ───────────────────────────────────────
  const diseases = [
    { code: 'J00', name: 'Viêm mũi họng cấp' },
    { code: 'J06.9', name: 'Nhiễm khuẩn hô hấp trên cấp tính' },
    { code: 'K30', name: 'Rối loạn tiêu hóa chức năng' },
    { code: 'R51', name: 'Nhức đầu' },
    { code: 'M54.5', name: 'Đau thắt lưng' },
    { code: 'Z00.0', name: 'Khám sức khỏe định kỳ' },
  ];

  for (const d of diseases) {
    await prisma.disease.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
  }
  console.log('✓ Diseases created');

  // ─── Step 8: Create Regulation Version ─────────────────────────────────────
  const hasActiveRegulation = await prisma.regulationVersion.count({
    where: { isActive: true },
  });

  if (hasActiveRegulation === 0) {
    await prisma.regulationVersion.create({
      data: {
        isActive: true,
        activatedAt: new Date(),
        note: 'Quy định khởi tạo mặc định ver1',
        items: {
          create: [
            { key: 'MAX_PATIENTS_PER_DAY', value: '40' },
            { key: 'CONSULTATION_FEE', value: '150000' },
          ],
        },
      },
    });
  }
  console.log('✓ Regulation version created');

  // ─── Step 9: Phase 2 — Departments ────────────────────────────────────────
  const departmentDefs = [
    { code: 'GENERAL', name: 'Nội khoa tổng quát' },
    { code: 'LAB', name: 'Xét nghiệm' },
    { code: 'PHARMACY', name: 'Nhà thuốc' },
  ];

  const departments: Record<string, { id: string }> = {};
  for (const dd of departmentDefs) {
    departments[dd.code] = await prisma.department.upsert({
      where: { code: dd.code },
      update: { name: dd.name },
      create: { code: dd.code, name: dd.name },
    });
  }
  console.log('✓ Departments created');

  // ─── Step 10: Phase 2 — Rooms ─────────────────────────────────────────────
  const roomDefs = [
    {
      departmentCode: 'GENERAL',
      code: 'CONS-01',
      name: 'Phòng khám 01',
      roomType: 'CONSULTATION',
    },
    {
      departmentCode: 'LAB',
      code: 'LAB-01',
      name: 'Phòng xét nghiệm 01',
      roomType: 'LAB',
    },
    {
      departmentCode: 'PHARMACY',
      code: 'PHARM-01',
      name: 'Quầy thuốc 01',
      roomType: 'PHARMACY',
    },
  ];

  for (const rd of roomDefs) {
    const departmentId = departments[rd.departmentCode].id;
    await prisma.room.upsert({
      where: { departmentId_code: { departmentId, code: rd.code } },
      update: { name: rd.name, roomType: rd.roomType },
      create: {
        departmentId,
        code: rd.code,
        name: rd.name,
        roomType: rd.roomType,
      },
    });
  }
  console.log('✓ Rooms created');

  // ─── Step 11: Phase 2 — DoctorProfile ─────────────────────────────────────
  const doctorUser = users['doctor'];
  const generalDeptId = departments['GENERAL'].id;

  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      departmentId: generalDeptId,
      title: 'BS.',
      specialty: 'Nội khoa tổng quát',
    },
  });
  console.log('✓ DoctorProfile created');

  // ─── Step 12: Phase 2 — ServiceCatalog ────────────────────────────────────
  const serviceDefs = [
    {
      code: 'CONSULT',
      name: 'Phí khám bệnh',
      type: 'CONSULTATION' as const,
      price: 150000,
    },
    {
      code: 'CBC',
      name: 'Công thức máu toàn phần',
      type: 'LAB_TEST' as const,
      price: 80000,
    },
    {
      code: 'URINE',
      name: 'Tổng phân tích nước tiểu',
      type: 'LAB_TEST' as const,
      price: 60000,
    },
  ];

  const services: Record<string, { id: string }> = {};
  for (const sd of serviceDefs) {
    services[sd.code] = await prisma.serviceCatalog.upsert({
      where: { code: sd.code },
      update: { name: sd.name, price: sd.price },
      create: { code: sd.code, name: sd.name, type: sd.type, price: sd.price },
    });
  }
  console.log('✓ ServiceCatalog created');

  // ─── Step 13: Phase 2 — LabTestCatalog ────────────────────────────────────
  const labTestDefs = [
    {
      code: 'CBC',
      serviceCode: 'CBC',
      sampleType: 'BLOOD',
      turnaroundHours: 4,
    },
    {
      code: 'URINE',
      serviceCode: 'URINE',
      sampleType: 'URINE',
      turnaroundHours: 2,
    },
  ];

  for (const ltd of labTestDefs) {
    await prisma.labTestCatalog.upsert({
      where: { code: ltd.code },
      update: {},
      create: {
        code: ltd.code,
        serviceId: services[ltd.serviceCode].id,
        sampleType: ltd.sampleType,
        turnaroundHours: ltd.turnaroundHours,
      },
    });
  }
  console.log('✓ LabTestCatalog created');

  // ─── Step 14: Phase 2 — StockLots (one lot per drug, quantity 100) ─────────
  const allDrugs = await prisma.drug.findMany();
  for (const drug of allDrugs) {
    await prisma.stockLot.upsert({
      where: {
        drugId_lotNumber: { drugId: drug.id, lotNumber: 'LOT-SEED-001' },
      },
      update: {},
      create: {
        drugId: drug.id,
        lotNumber: 'LOT-SEED-001',
        expiryDate: new Date('2027-12-31'),
        quantityOnHand: 100,
      },
    });
  }
  console.log('✓ StockLots created');

  // ─── Step 15: Demo Patients ───────────────────────────────────────────────
  const patientDefs = [
    {
      patientCode: 'BN001',
      fullName: 'Nguyễn Thị Mai',
      gender: 'FEMALE',
      dob: new Date('1985-03-15'),
      phone: '0901234001',
      address: '12 Nguyễn Trãi, Q.1, TP.HCM',
    },
    {
      patientCode: 'BN002',
      fullName: 'Trần Văn Hùng',
      gender: 'MALE',
      dob: new Date('1972-07-22'),
      phone: '0901234002',
      address: '45 Lê Lợi, Q.3, TP.HCM',
    },
    {
      patientCode: 'BN003',
      fullName: 'Lê Thị Lan',
      gender: 'FEMALE',
      dob: new Date('1995-11-08'),
      phone: '0901234003',
      address: '78 Võ Văn Tần, Q.5, TP.HCM',
    },
    {
      patientCode: 'BN004',
      fullName: 'Phạm Quốc Bảo',
      gender: 'MALE',
      dob: new Date('2001-01-30'),
      phone: '0901234004',
      address: '9 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM',
    },
    {
      patientCode: 'BN005',
      fullName: 'Hoàng Minh Tuấn',
      gender: 'MALE',
      dob: new Date('1960-05-19'),
      phone: '0901234005',
      address: '33 Cách Mạng Tháng 8, Q.10, TP.HCM',
    },
  ];

  const patients: Record<string, { id: string }> = {};
  for (const pd of patientDefs) {
    patients[pd.patientCode] = await prisma.patient.upsert({
      where: { patientCode: pd.patientCode },
      update: {},
      create: pd,
    });
  }
  console.log('✓ Patients created');

  // ─── Step 16: Demo Visits + Examinations (today's date) ──────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const doctorUserId = users['doctor'].id;
  const receptionistUserId = users['receptionist'].id;

  // Visit 1: WAITING — chờ khám
  await prisma.visit.upsert({
    where: {
      patientId_visitDate: { patientId: patients['BN001'].id, visitDate: today },
    },
    update: {},
    create: {
      patientId: patients['BN001'].id,
      visitDate: today,
      queueNumber: 1,
      status: 'WAITING',
      reason: 'Sốt, ho, đau họng 3 ngày',
      createdByUserId: receptionistUserId,
    },
  });

  // Visit 2: IN_EXAMINATION — đang khám (có examination OPEN)
  const visit2 = await prisma.visit.upsert({
    where: { patientId_visitDate: { patientId: patients['BN002'].id, visitDate: today } },
    update: {},
    create: {
      patientId: patients['BN002'].id,
      visitDate: today,
      queueNumber: 2,
      status: 'IN_EXAMINATION',
      reason: 'Đau lưng mãn tính',
      createdByUserId: receptionistUserId,
    },
  });

  // Examination OPEN cho visit2
  await prisma.examination.upsert({
    where: { visitId: visit2.id },
    update: {},
    create: {
      visitId: visit2.id,
      doctorUserId,
      status: 'OPEN',
      symptoms: 'Đau vùng thắt lưng lan xuống chân trái, tăng khi ngồi lâu',
      clinicalNotes: 'Cột sống thắt lưng đau khi ấn L4-L5',
    },
  });

  // Visit 3: COMPLETED — đã hoàn tất (có examination COMPLETED + prescription)
  const visitCompletedDate = new Date(today);
  visitCompletedDate.setDate(visitCompletedDate.getDate() - 1); // hôm qua

  const visit3 = await prisma.visit.upsert({
    where: { patientId_visitDate: { patientId: patients['BN003'].id, visitDate: visitCompletedDate } },
    update: {},
    create: {
      patientId: patients['BN003'].id,
      visitDate: visitCompletedDate,
      queueNumber: 1,
      status: 'COMPLETED',
      reason: 'Khám sức khỏe định kỳ',
      createdByUserId: receptionistUserId,
    },
  });

  const exam3 = await prisma.examination.upsert({
    where: { visitId: visit3.id },
    update: {},
    create: {
      visitId: visit3.id,
      doctorUserId,
      status: 'COMPLETED',
      symptoms: 'Không có triệu chứng bất thường',
      clinicalNotes: 'Huyết áp 120/80, nhịp tim 72 lần/phút, cân nặng 55kg',
      conclusion: 'Sức khỏe ổn định. Tái khám sau 6 tháng.',
      completedAt: new Date(),
    },
  });

  // Diagnosis + prescription cho examination đã hoàn tất
  const existingDiag = await prisma.diagnosis.findFirst({
    where: { examinationId: exam3.id },
  });
  if (!existingDiag) {
    const z000Disease = await prisma.disease.findFirst({ where: { code: 'Z00.0' } });
    if (z000Disease) {
      await prisma.diagnosis.create({
        data: {
          examinationId: exam3.id,
          diseaseId: z000Disease.id,
          name: z000Disease.name,
          isPrimary: true,
        },
      });
    }
  }

  const existingPrescription = await prisma.prescription.findUnique({
    where: { examinationId: exam3.id },
  });
  if (!existingPrescription) {
    const vitaminC = await prisma.drug.findFirst({ where: { name: { contains: 'Vitamin C' } } });
    if (vitaminC) {
      await prisma.prescription.create({
        data: {
          examinationId: exam3.id,
          note: 'Uống sau bữa ăn sáng',
          items: {
            create: [{
              drugId: vitaminC.id,
              quantity: 30,
              dosage: '1 viên/ngày',
              unitPrice: Number(vitaminC.price),
              lineTotal: Number(vitaminC.price) * 30,
            }],
          },
        },
      });
    }
  }

  // Visit 4 & 5: hôm nay, WAITING — thêm bệnh nhân chờ
  await prisma.visit.upsert({
    where: { patientId_visitDate: { patientId: patients['BN004'].id, visitDate: today } },
    update: {},
    create: {
      patientId: patients['BN004'].id,
      visitDate: today,
      queueNumber: 3,
      status: 'WAITING',
      reason: 'Đau đầu kéo dài',
      createdByUserId: receptionistUserId,
    },
  });

  await prisma.visit.upsert({
    where: { patientId_visitDate: { patientId: patients['BN005'].id, visitDate: today } },
    update: {},
    create: {
      patientId: patients['BN005'].id,
      visitDate: today,
      queueNumber: 4,
      status: 'WAITING',
      reason: 'Rối loạn tiêu hóa, buồn nôn',
      createdByUserId: receptionistUserId,
    },
  });

  console.log('✓ Demo visits + examinations created');

  console.log('');
  console.log('✓ SEED COMPLETED SUCCESSFULLY');
  console.log('─────────────────────────────────────');
  console.log('Roles:', roleDefinitions.map((r) => r.code).join(', '));
  console.log('Users:', Object.keys(users).join(', '));
  console.log('Permissions:', permissionDefinitions.length, 'items');
  console.log('Drugs:', drugs.length, 'items');
  console.log('Diseases:', diseases.length, 'items');
  console.log('Patients: 5 demo patients');
  console.log('Visits: 5 demo visits (3 today, 1 yesterday completed)');
  console.log('');
  console.log('Default login credentials:');
  console.log('  admin@clinic.local / Admin@123456');
  console.log('  doctor@clinic.local / Doctor@123456');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
