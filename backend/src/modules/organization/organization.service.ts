import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateRoomDto, UpdateRoomDto } from './dto/create-room.dto';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto/create-doctor-profile.dto';
import {
  CreateStaffScheduleDto,
  QueryScheduleDto,
} from './dto/create-staff-schedule.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Departments ───────────────────────────────────────────────────────────

  async findDepartments(isActive?: boolean) {
    return this.prisma.department.findMany({
      where: isActive !== undefined ? { isActive } : {},
      include: {
        rooms: {
          where: { isActive: true },
          select: { id: true, code: true, name: true, roomType: true },
          orderBy: { code: 'asc' },
        },
        _count: { select: { doctorProfiles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Department code '${dto.code}' already exists`,
      );
    }
    return this.prisma.department.create({
      data: { code: dto.code, name: dto.name, description: dto.description },
    });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.findDepartmentOrThrow(id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  // ─── Rooms ────────────────────────────────────────────────────────────────

  async findRooms(departmentId?: string) {
    return this.prisma.room.findMany({
      where: departmentId ? { departmentId } : {},
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ departmentId: 'asc' }, { code: 'asc' }],
    });
  }

  async createRoom(dto: CreateRoomDto) {
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!dept) throw new NotFoundException('Department not found');
    if (!dept.isActive) throw new BadRequestException('Department is inactive');

    const existing = await this.prisma.room.findUnique({
      where: {
        departmentId_code: { departmentId: dto.departmentId, code: dto.code },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Room code '${dto.code}' already exists in this department`,
      );
    }

    return this.prisma.room.create({ data: dto });
  }

  async updateRoom(id: string, dto: UpdateRoomDto) {
    await this.findRoomOrThrow(id);
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  // ─── DoctorProfiles ───────────────────────────────────────────────────────

  async findDoctors() {
    return this.prisma.doctorProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { user: { fullName: 'asc' } },
    });
  }

  async createDoctorProfile(dto: CreateDoctorProfileDto) {
    // BR-ORG-03: user phải có role DOCTOR
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const hasDoctor = user.userRoles.some((ur) => ur.role.code === 'DOCTOR');
    if (!hasDoctor) {
      throw new BadRequestException(
        'User must have DOCTOR role to create a profile',
      );
    }

    // BR-ORG-04: mỗi user chỉ có 1 DoctorProfile (unique constraint in schema)
    const existing = await this.prisma.doctorProfile.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException(
        'Doctor profile already exists for this user',
      );
    }

    await this.findDepartmentOrThrow(dto.departmentId);

    return this.prisma.doctorProfile.create({
      data: dto,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async updateDoctorProfile(id: string, dto: UpdateDoctorProfileDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id },
    });
    if (!profile) throw new NotFoundException('Doctor profile not found');

    if (dto.departmentId) await this.findDepartmentOrThrow(dto.departmentId);

    return this.prisma.doctorProfile.update({ where: { id }, data: dto });
  }

  // ─── StaffSchedules ───────────────────────────────────────────────────────

  async findSchedules(query: QueryScheduleDto) {
    return this.prisma.staffSchedule.findMany({
      where: {
        ...(query.from || query.to
          ? {
              workDate: {
                gte: query.from ? new Date(query.from) : undefined,
                lte: query.to ? new Date(query.to) : undefined,
              },
            }
          : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true } },
        department: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ workDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createSchedule(dto: CreateStaffScheduleDto) {
    // BR-ORG-05: endTime phải sau startTime
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.findDepartmentOrThrow(dto.departmentId);

    if (dto.roomId) {
      await this.findRoomOrThrow(dto.roomId);
    }

    return this.prisma.staffSchedule.create({
      data: {
        userId: dto.userId,
        departmentId: dto.departmentId,
        roomId: dto.roomId,
        workDate: new Date(dto.workDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDurationMinutes: dto.slotDurationMinutes ?? 15,
        maxAppointments: dto.maxAppointments ?? 20,
      },
      include: {
        user: { select: { id: true, fullName: true } },
        room: { select: { id: true, name: true } },
      },
    });
  }

  async deleteSchedule(id: string) {
    const schedule = await this.prisma.staffSchedule.findUnique({
      where: { id },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    await this.prisma.staffSchedule.delete({ where: { id } });
    return { success: true };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findDepartmentOrThrow(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  private async findRoomOrThrow(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }
}
