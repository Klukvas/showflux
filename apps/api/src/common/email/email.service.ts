import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { escapeHtml } from '../utils/crypto.util.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.fromEmail = this.configService.getOrThrow<string>('RESEND_FROM_EMAIL');
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async sendPasswordReset(email: string, rawToken: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${rawToken}`;

    const html = [
      '<h2>Password Reset Request</h2>',
      '<p>You requested a password reset for your ShowFlux account.</p>',
      '<p>Click the button below to reset your password:</p>',
      `<p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a></p>`,
      `<p>Or copy and paste this link into your browser:</p>`,
      `<p>${resetUrl}</p>`,
      '<p>This link expires in 1 hour.</p>',
      '<p>If you did not request this reset, you can safely ignore this email.</p>',
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your ShowFlux password',
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendInvite(
    email: string,
    rawToken: string,
    workspaceName: string,
  ): Promise<void> {
    const inviteUrl = `${this.frontendUrl}/invite/${rawToken}`;
    const safeName = escapeHtml(workspaceName);

    const html = [
      "<h2>You're Invited to ShowFlux</h2>",
      `<p>You've been invited to join the <strong>${safeName}</strong> workspace on ShowFlux.</p>`,
      '<p>Click the button below to accept your invitation and create your account:</p>',
      `<p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Accept Invitation</a></p>`,
      `<p>Or copy and paste this link into your browser:</p>`,
      `<p>${inviteUrl}</p>`,
      '<p>This invitation expires in 7 days.</p>',
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `You're invited to join ${safeName} on ShowFlux`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send invite email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
