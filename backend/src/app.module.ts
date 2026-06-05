import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { PatientsModule } from './modules/patients/patients.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './health/health.module';

import { DiseasesModule } from './modules/diseases/diseases.module';
import { DrugsModule } from './modules/drugs/drugs.module';

import { RegulationsModule } from './modules/regulations/regulations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { VisitsModule } from './modules/visits/visits.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { QueueModule } from './modules/queue/queue.module';
import { VitalsModule } from './modules/vitals/vitals.module';
import { ServicesModule } from './modules/services/services.module';
import { LabModule } from './modules/lab/lab.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
      signOptions: {
        expiresIn: '1d',
      },
    }),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RbacModule,
    PatientsModule,
    VisitsModule,
    ExaminationsModule,
    BillingModule,
    RegulationsModule,
    DiseasesModule,
    DrugsModule,
    ReportsModule,
    OrganizationModule,
    AppointmentsModule,
    QueueModule,
    VitalsModule,
    ServicesModule,
    LabModule,
    InventoryModule,
    PharmacyModule,
  ],
})
export class AppModule {}
