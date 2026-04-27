import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { VisitsModule } from './modules/visits/visits.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { BillingModule } from './modules/billing/billing.module';

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
    AuthModule,
    PatientsModule,
    VisitsModule,
    ExaminationsModule,
    BillingModule,
  ],
})
export class AppModule {}
