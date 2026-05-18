import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─── Step 1: Migrate existing roles (email-based schema → code-based) ──────
  // Nếu roles cũ có name nhưng chưa có code, gán code = name
  const legacyRoleNames = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'MANAGER'];
  for (const roleName of legacyRoleNames) {
    await prisma.role.updateMany({
      where: { name: roleName, code: null },
      data: { code: roleName },
    });
  }

  // ─── Step 2: Upsert roles by code ────────────────────────────────────────
  const roleDefinitions = [
    { code: 'ADMIN', name: 'Quản trị viên', description: 'Toàn quyền hệ thống' },
    { code: 'DOCTOR', name: 'Bác sĩ', description: 'Thực hiện khám bệnh' },
    { code: 'RECEPTIONIST', name: 'Lễ tân', description: 'Tiếp nhận bệnh nhân' },
    { code: 'CASHIER', name: 'Thu ngân', description: 'Xử lý thanh toán' },
    { code: 'MANAGER', name: 'Quản lý', description: 'Xem báo cáo và thống kê' },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const rd of roleDefinitions) {
    roles[rd.code] = await prisma.role.upsert({
      where: { code: rd.code },
      update: { name: rd.name, description: rd.description },
      create: rd,
    });
  }

  // ─── Step 3: Migrate existing users (email-based → username-based) ────────
  const legacyUserMap = [
    { email: 'admin@clinic.local', username: 'admin' },
    { email: 'doctor@clinic.local', username: 'doctor' },
    { email: 'receptionist@clinic.local', username: 'receptionist' },
    { email: 'cashier@clinic.local', username: 'cashier' },
    { email: 'manager@clinic.local', username: 'manager' },
  ];
  for (const { email, username } of legacyUserMap) {
    await prisma.user.updateMany({
      where: { email, username: null },
      data: { username },
    });
  }

  // ─── Step 4: Upsert seed users by username ────────────────────────────────
  const [adminUser, doctorUser, receptionistUser, cashierUser, managerUser] =
    await Promise.all([
      prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
          username: 'admin',
          fullName: 'System Admin',
          email: 'admin@clinic.local',
          passwordHash: await bcrypt.hash('Admin@123', 10),
        },
      }),
      prisma.user.upsert({
        where: { username: 'doctor' },
        update: {},
        create: {
          username: 'doctor',
          fullName: 'Bác sĩ Demo',
          email: 'doctor@clinic.local',
          passwordHash: await bcrypt.hash('Doctor@123456', 10),
        },
      }),
      prisma.user.upsert({
        where: { username: 'receptionist' },
        update: {},
        create: {
          username: 'receptionist',
          fullName: 'Lễ tân Demo',
          email: 'receptionist@clinic.local',
          passwordHash: await bcrypt.hash('Reception@123456', 10),
        },
      }),
      prisma.user.upsert({
        where: { username: 'cashier' },
        update: {},
        create: {
          username: 'cashier',
          fullName: 'Thu ngân Demo',
          email: 'cashier@clinic.local',
          passwordHash: await bcrypt.hash('Cashier@123456', 10),
        },
      }),
      prisma.user.upsert({
        where: { username: 'manager' },
        update: {},
        create: {
          username: 'manager',
          fullName: 'Quản lý Demo',
          email: 'manager@clinic.local',
          passwordHash: await bcrypt.hash('Manager@123456', 10),
        },
      }),
    ]);

  // ─── Step 5: Assign roles to seed users (idempotent) ─────────────────────
  const userRoleAssignments = [
    { user: adminUser, roleCode: 'ADMIN' },
    { user: doctorUser, roleCode: 'DOCTOR' },
    { user: receptionistUser, roleCode: 'RECEPTIONIST' },
    { user: cashierUser, roleCode: 'CASHIER' },
    { user: managerUser, roleCode: 'MANAGER' },
  ];

  for (const { user, roleCode } of userRoleAssignments) {
    const roleId = roles[roleCode].id;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
  }

  // ─── Step 6: Upsert permissions ───────────────────────────────────────────
  const permissionDefinitions = [
    { code: 'USER_READ', name: 'Xem danh sách người dùng' },
    { code: 'USER_CREATE', name: 'Tạo người dùng' },
    { code: 'USER_UPDATE', name: 'Cập nhật thông tin người dùng' },
    { code: 'USER_LOCK', name: 'Khóa/mở khóa người dùng' },
    { code: 'USER_ASSIGN_ROLE', name: 'Gán vai trò cho người dùng' },
    { code: 'RBAC_ROLE_READ', name: 'Xem danh sách vai trò' },
    { code: 'RBAC_PERMISSION_READ', name: 'Xem danh sách quyền' },
    { code: 'RBAC_ROLE_UPDATE_PERMISSION', name: 'Cập nhật quyền của vai trò' },
    { code: 'AUTH_ME', name: 'Xem thông tin tài khoản hiện tại' },
    { code: 'AUDIT_READ', name: 'Xem nhật ký hệ thống' },
  ];

  const perms: Record<string, { id: string }> = {};
  for (const pd of permissionDefinitions) {
    perms[pd.code] = await prisma.permission.upsert({
      where: { code: pd.code },
      update: { name: pd.name },
      create: pd,
    });
  }

  // ─── Step 7: Assign all permissions to ADMIN role (replace, idempotent) ───
  const adminRoleId = roles['ADMIN'].id;
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRoleId } });
  await prisma.rolePermission.createMany({
    data: Object.values(perms).map((p) => ({
      roleId: adminRoleId,
      permissionId: p.id,
    })),
  });

  // ─── Drug catalog ─────────────────────────────────────────────────────────
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

  // ─── Disease catalog ──────────────────────────────────────────────────────
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

  // ─── Regulation (ver1 defaults) ───────────────────────────────────────────
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

  console.log('✓ Seed completed');
  console.log(
    '  Roles:',
    roleDefinitions.map((r) => r.code).join(', '),
  );
  console.log(
    '  Users: admin (Admin@123), doctor, receptionist, cashier, manager',
  );
  console.log(`  Permissions: ${permissionDefinitions.length} items`);
  console.log(
    `  Admin permissions: all ${permissionDefinitions.length} assigned`,
  );
  console.log(`  Drugs: ${drugs.length} items`);
  console.log(`  Diseases: ${diseases.length} items`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
