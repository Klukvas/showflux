const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { createMockConfigService } from '../../test-utils/mocks';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(async () => {
    configService = createMockConfigService({
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM_EMAIL: 'noreply@showflux.com',
      FRONTEND_URL: 'https://showflux.com',
    });

    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPasswordReset', () => {
    it('should send email with correct from/to/subject and reset URL', async () => {
      mockSend.mockResolvedValue({ id: 'msg-1' });

      await service.sendPasswordReset('user@example.com', 'raw-token-123');

      expect(mockSend).toHaveBeenCalledWith({
        from: 'noreply@showflux.com',
        to: 'user@example.com',
        subject: 'Reset your ShowFlux password',
        html: expect.stringContaining(
          'https://showflux.com/reset-password?token=raw-token-123',
        ),
      });
    });

    it('should not throw when Resend API fails', async () => {
      mockSend.mockRejectedValue(new Error('Resend API error'));

      await expect(
        service.sendPasswordReset('user@example.com', 'token'),
      ).resolves.toBeUndefined();
    });

    it('should log error on failure', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation();
      mockSend.mockRejectedValue(new Error('API failure'));

      await service.sendPasswordReset('user@example.com', 'token');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to send password reset email to user@example.com',
        expect.any(String),
      );
    });
  });

  describe('sendInvite', () => {
    it('should send email with correct from/to/subject and invite URL + workspace name', async () => {
      mockSend.mockResolvedValue({ id: 'msg-2' });

      await service.sendInvite(
        'agent@example.com',
        'invite-token-456',
        'Acme Realty',
      );

      expect(mockSend).toHaveBeenCalledWith({
        from: 'noreply@showflux.com',
        to: 'agent@example.com',
        subject: "You're invited to join Acme Realty on ShowFlux",
        html: expect.stringContaining(
          'https://showflux.com/invite/invite-token-456',
        ),
      });

      const html = mockSend.mock.calls[0][0].html as string;
      expect(html).toContain('Acme Realty');
    });

    it('should escape HTML in workspace name to prevent XSS', async () => {
      mockSend.mockResolvedValue({ id: 'msg-xss' });

      await service.sendInvite(
        'agent@example.com',
        'token',
        '<script>alert(1)</script>',
      );

      const html = mockSend.mock.calls[0][0].html as string;
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('should not throw when Resend API fails', async () => {
      mockSend.mockRejectedValue(new Error('Resend API error'));

      await expect(
        service.sendInvite('agent@example.com', 'token', 'WS'),
      ).resolves.toBeUndefined();
    });

    it('should log error on failure', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation();
      mockSend.mockRejectedValue(new Error('API failure'));

      await service.sendInvite('agent@example.com', 'token', 'WS');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to send invite email to agent@example.com',
        expect.any(String),
      );
    });
  });
});
