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

  console.log('');
  console.log('✓ SEED COMPLETED SUCCESSFULLY');
  console.log('─────────────────────────────────────');
  console.log('Roles:', roleDefinitions.map((r) => r.code).join(', '));
  console.log('Users:', Object.keys(users).join(', '));
  console.log('Permissions:', permissionDefinitions.length, 'items');
  console.log('Drugs:', drugs.length, 'items');
  console.log('Diseases:', diseases.length, 'items');
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
