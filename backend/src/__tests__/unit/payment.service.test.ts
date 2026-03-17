import { PaymentService } from '../../services/payment.service';
import { prismaMock } from '../client';
import PayOS from '@payos/node';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => require('../client').prismaMock),
}));

// Mock PayOS
jest.mock('@payos/node');

describe('PaymentService - handleWebhook', () => {
  const mockWebhookBody = { data: 'encrypted-data', signature: 'valid-sig' };

  beforeEach(() => {
    // Mock PayOS verification thành công
    (PayOS.prototype.verifyPaymentWebhookData as jest.Mock).mockReturnValue({
      orderCode: 123456,
      amount: 500000,
      code: '00'
    });
  });

  it('Phải bỏ qua nếu Order không phải PENDING (Idempotency)', async () => {
    // Giả lập transaction
    // @ts-ignore
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const txMock = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'order-1',
            status: 'SUCCESS', // Trạng thái đã xử lý
            amount: 500000
          }),
          update: jest.fn()
        },
        enrollment: { create: jest.fn() }
      };
      await cb(txMock as any);
      
      // Order đã SUCCESS nên không được update hay tạo enrollment nữa
      expect(txMock.order.update).not.toHaveBeenCalled();
      expect(txMock.enrollment.create).not.toHaveBeenCalled();
    });

    await PaymentService.handleWebhook(mockWebhookBody);
  });

  it('Phải tạo Enrollment và update Order thành SUCCESS nếu hợp lệ', async () => {
    // @ts-ignore
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const txMock = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'order-2',
            status: 'PENDING',
            amount: 500000,
            userId: 'user-1',
            courseId: 'course-1'
          }),
          update: jest.fn()
        },
        enrollment: { create: jest.fn() }
      };
      await cb(txMock as any);

      expect(txMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'SUCCESS' } })
      );
      expect(txMock.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: 'user-1', courseId: 'course-1', status: 'ACTIVE' } })
      );
    });

    await PaymentService.handleWebhook(mockWebhookBody);
  });
});
