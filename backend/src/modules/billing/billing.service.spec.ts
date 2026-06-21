import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, VisitStatus } from '@prisma/client';

import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * White-box unit test cho BillingService.
 *
 * Mục tiêu: kiểm thử các business rule của UC-14 (lập hóa đơn) và UC-15
 * (ghi nhận thanh toán) ở mức service layer, KHÔNG cần database thật.
 * Prisma và AuditService được mock hoàn toàn nên test chạy nhanh, tất định.
 */
describe('BillingService (unit, white-box)', () => {
  let service: BillingService;
  let prisma: {
    regulationVersion: { findFirst: jest.Mock };
    invoice: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    payment: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      regulationVersion: { findFirst: jest.fn() },
      invoice: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      payment: { create: jest.fn() },
      // $transaction nhận callback và truyền chính prisma mock làm "tx"
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('createPayment — UC-15 business rules', () => {
    const invoiceId = 'inv-1';

    it('BR: từ chối số tiền <= 0', async () => {
      await expect(
        service.createPayment(invoiceId, { amount: 0, method: 'CASH' }, 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('BR: 404 khi hóa đơn không tồn tại', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      await expect(
        service.createPayment(invoiceId, { amount: 1000, method: 'CASH' }, 'u1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('BR: không cho thanh toán hóa đơn VOID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.VOID,
        totalAmount: 100000,
        paidAmount: 0,
      });
      await expect(
        service.createPayment(invoiceId, { amount: 1000, method: 'CASH' }, 'u1'),
      ).rejects.toThrow('Cannot pay voided invoice');
    });

    it('BR: không cho thanh toán hóa đơn đã PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PAID,
        totalAmount: 100000,
        paidAmount: 100000,
      });
      await expect(
        service.createPayment(invoiceId, { amount: 1000, method: 'CASH' }, 'u1'),
      ).rejects.toThrow('Invoice is already paid');
    });

    it('BR: từ chối khi số tiền vượt quá phần còn lại', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.ISSUED,
        totalAmount: 100000,
        paidAmount: 80000,
      });
      await expect(
        service.createPayment(
          invoiceId,
          { amount: 30000, method: 'CASH' },
          'u1',
        ),
      ).rejects.toThrow(/exceeds remaining amount/);
    });

    it('thanh toán một phần → status PARTIALLY_PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.ISSUED,
        totalAmount: 100000,
        paidAmount: 0,
      });
      prisma.payment.create.mockResolvedValue({});
      prisma.invoice.update.mockImplementation(({ data }: any) => ({
        id: invoiceId,
        ...data,
      }));

      const result = await service.createPayment(
        invoiceId,
        { amount: 40000, method: 'CASH' },
        'u1',
      );

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(result.paidAmount).toBe(40000);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_PAYMENT' }),
      );
    });

    it('thanh toán đủ → status PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PARTIALLY_PAID,
        totalAmount: 100000,
        paidAmount: 60000,
      });
      prisma.payment.create.mockResolvedValue({});
      prisma.invoice.update.mockImplementation(({ data }: any) => ({
        id: invoiceId,
        ...data,
      }));

      const result = await service.createPayment(
        invoiceId,
        { amount: 40000, method: 'TRANSFER' },
        'u1',
      );

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paidAmount).toBe(100000);
    });
  });

  describe('createInvoiceFromVisit — UC-14 business rules', () => {
    it('404 khi visit không tồn tại', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      // visit lookup dùng prisma.visit.findUnique — bổ sung mock
      (prisma as any).visit = { findUnique: jest.fn().mockResolvedValue(null) };

      await expect(
        service.createInvoiceFromVisit('v-404', 'u1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('400 khi visit chưa COMPLETED', async () => {
      (prisma as any).visit = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'v1',
          status: VisitStatus.IN_EXAMINATION,
          invoice: null,
          examination: null,
        }),
      };

      await expect(
        service.createInvoiceFromVisit('v1', 'u1'),
      ).rejects.toThrow('Only COMPLETED visit can be converted to invoice');
    });
  });
});
