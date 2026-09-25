import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BookingService', () => {
  let service: BookingService;
  let mockPrisma = {
    booking: {
      create: jest.fn().mockResolvedValue({ id: 'bkg-1', status: 'CONFIRMED' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'bkg-1', status: 'CONFIRMED', userId: 'user-1' }),
      update: jest.fn().mockResolvedValue({ id: 'bkg-1', status: 'CANCELLED' }),
    },
    waitlistEntry: {
      findMany: jest.fn().mockResolvedValue([{ id: 'wl-1', userId: 'user-2' }]),
      update: jest.fn(),
    }
  };
  let mockNotifications = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should auto-notify waitlist upon cancellation', async () => {
    await service.cancelBooking('bkg-1');
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'bkg-1' },
      data: { status: 'CANCELLED' }
    });
    expect(mockNotifications.createNotification).toHaveBeenCalled();
    expect(mockPrisma.waitlistEntry.update).toHaveBeenCalled();
  });
});
