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
    { username: 'admin', fullName: 'System Admin', email: 'admin@clinic.local', password: 'Admin@123456', roleCode: 'ADMIN' },
    { username: 'doctor', fullName: 'Bác sĩ Demo', email: 'doctor@clinic.local', password: 'Doctor@123456', roleCode: 'DOCTOR' },
    { username: 'receptionist', fullName: 'Lễ tân Demo', email: 'receptionist@clinic.local', password: 'Reception@123456', roleCode: 'RECEPTIONIST' },
    { username: 'cashier', fullName: 'Thu ngân Demo', email: 'cashier@clinic.local', password: 'Cashier@123456', roleCode: 'CASHIER' },
    { username: 'manager', fullName: 'Quản lý Demo', email: 'manager@clinic.local', password: 'Manager@123456', roleCode: 'MANAGER' },
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
