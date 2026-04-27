import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const doctorRole = await prisma.role.upsert({
    where: { name: 'DOCTOR' },
    update: {},
    create: { name: 'DOCTOR' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@clinic.local' },
    update: {},
    create: {
      email: 'admin@clinic.local',
      fullName: 'System Admin',
      passwordHash: await bcrypt.hash('Admin@123456', 10),
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'doctor@clinic.local' },
    update: {},
    create: {
      email: 'doctor@clinic.local',
      fullName: 'Demo Doctor',
      passwordHash: await bcrypt.hash('Doctor@123456', 10),
      roleId: doctorRole.id,
    },
  });

  await prisma.drug.upsert({
    where: { name: 'Paracetamol 500mg' },
    update: {},
    create: {
      name: 'Paracetamol 500mg',
      unit: 'viên',
      price: 2000,
    },
  }).catch(() => {});

  await prisma.drug.upsert({
    where: { name: 'Vitamin C' },
    update: {},
    create: {
      name: 'Vitamin C',
      unit: 'viên',
      price: 1500,
    },
  }).catch(() => {});

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
