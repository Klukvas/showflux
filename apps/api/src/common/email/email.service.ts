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

  async sendWelcome(
    email: string,
    fullName: string,
    workspaceName: string,
  ): Promise<void> {
    const safeName = escapeHtml(workspaceName);
    const safeFullName = escapeHtml(fullName);
    const loginUrl = `${this.frontendUrl}/login`;

    const html = [
      `<h2>Welcome to ShowFlux, ${safeFullName}!</h2>`,
      `<p>Your workspace <strong>${safeName}</strong> is ready. You have a 14-day free trial to explore all features.</p>`,
      '<p>Get started by adding your first listing:</p>',
      `<p><a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Go to ShowFlux</a></p>`,
      "<p>Need help? Reply to this email — we're here for you.</p>",
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Welcome to ShowFlux, ${safeFullName}!`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendTrialEndingSoon(
    email: string,
    workspaceName: string,
    daysLeft: number,
  ): Promise<void> {
    const safeName = escapeHtml(workspaceName);
    const settingsUrl = `${this.frontendUrl}/settings`;

    const html = [
      '<h2>Your Trial Is Ending Soon</h2>',
      `<p>Your free trial for <strong>${safeName}</strong> ends in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>`,
      '<p>Subscribe now to keep access to all your listings, showings, and offers:</p>',
      `<p><a href="${settingsUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Choose a Plan</a></p>`,
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Your ShowFlux trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send trial-ending email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendTrialExpired(email: string, workspaceName: string): Promise<void> {
    const safeName = escapeHtml(workspaceName);
    const settingsUrl = `${this.frontendUrl}/settings`;

    const html = [
      '<h2>Your Trial Has Expired</h2>',
      `<p>The free trial for <strong>${safeName}</strong> has ended.</p>`,
      '<p>Your data is safe — subscribe to regain access:</p>',
      `<p><a href="${settingsUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Subscribe Now</a></p>`,
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your ShowFlux trial has expired',
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send trial-expired email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendPaymentFailed(email: string, workspaceName: string): Promise<void> {
    const safeName = escapeHtml(workspaceName);
    const settingsUrl = `${this.frontendUrl}/settings`;

    const html = [
      '<h2>Payment Failed</h2>',
      `<p>We couldn't process the payment for <strong>${safeName}</strong>.</p>`,
      '<p>Please update your payment method to avoid service interruption:</p>',
      `<p><a href="${settingsUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Update Payment</a></p>`,
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'ShowFlux: Payment failed — action required',
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send payment-failed email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendSubscriptionCanceled(
    email: string,
    workspaceName: string,
  ): Promise<void> {
    const safeName = escapeHtml(workspaceName);

    const html = [
      '<h2>Subscription Canceled</h2>',
      `<p>Your subscription for <strong>${safeName}</strong> has been canceled.</p>`,
      '<p>Your data will be retained. You can resubscribe at any time to regain access.</p>',
      "<p>We're sorry to see you go. If you have feedback, reply to this email.</p>",
    ].join('\n');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your ShowFlux subscription has been canceled',
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send subscription-canceled email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
