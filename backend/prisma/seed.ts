import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─── Roles ────────────────────────────────────────────────────────────────
  const [adminRole, doctorRole, receptionistRole, cashierRole, managerRole] =
    await Promise.all([
      prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN' },
      }),
      prisma.role.upsert({
        where: { name: 'DOCTOR' },
        update: {},
        create: { name: 'DOCTOR' },
      }),
      prisma.role.upsert({
        where: { name: 'RECEPTIONIST' },
        update: {},
        create: { name: 'RECEPTIONIST' },
      }),
      prisma.role.upsert({
        where: { name: 'CASHIER' },
        update: {},
        create: { name: 'CASHIER' },
      }),
      prisma.role.upsert({
        where: { name: 'MANAGER' },
        update: {},
        create: { name: 'MANAGER' },
      }),
    ]);

  // ─── Users ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@clinic.local' },
      update: {},
      create: {
        email: 'admin@clinic.local',
        fullName: 'System Admin',
        passwordHash: await bcrypt.hash('Admin@123456', 10),
        roleId: adminRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'doctor@clinic.local' },
      update: {},
      create: {
        email: 'doctor@clinic.local',
        fullName: 'Bác sĩ Demo',
        passwordHash: await bcrypt.hash('Doctor@123456', 10),
        roleId: doctorRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'receptionist@clinic.local' },
      update: {},
      create: {
        email: 'receptionist@clinic.local',
        fullName: 'Lễ tân Demo',
        passwordHash: await bcrypt.hash('Reception@123456', 10),
        roleId: receptionistRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'cashier@clinic.local' },
      update: {},
      create: {
        email: 'cashier@clinic.local',
        fullName: 'Thu ngân Demo',
        passwordHash: await bcrypt.hash('Cashier@123456', 10),
        roleId: cashierRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@clinic.local' },
      update: {},
      create: {
        email: 'manager@clinic.local',
        fullName: 'Quản lý Demo',
        passwordHash: await bcrypt.hash('Manager@123456', 10),
        roleId: managerRole.id,
      },
    }),
  ]);

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
  await prisma.regulationVersion.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const regulation = await prisma.regulationVersion.create({
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

  console.log('✓ Seed completed');
  console.log(
    '  Roles:',
    ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'MANAGER'].join(', '),
  );
  console.log(
    '  Users: admin, doctor, receptionist, cashier, manager @clinic.local',
  );
  console.log(`  Drugs: ${drugs.length} items`);
  console.log(`  Diseases: ${diseases.length} items`);
  console.log(`  Regulation version: ${regulation.id} (active)`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
