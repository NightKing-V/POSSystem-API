import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('SMTP mail transporter initialized successfully.');
    } else {
      this.logger.warn(
        'SMTP environment variables are missing. Mail service will default to console logging.',
      );
    }
  }

  private async sendMail(to: string, subject: string, text: string) {
    const from = process.env.SMTP_FROM || 'no-reply@possystem.com';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
        });
        this.logger.log(`Email sent successfully to ${to}`);
      } catch (error: any) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      }
    } else {
      this.logger.log(`
============================================================
[MOCK EMAIL SENT]
To: ${to}
From: ${from}
Subject: ${subject}
Body:
${text}
============================================================
`);
    }
  }

  async sendWelcomeBackEmail(email: string, orgId: string) {
    const subject = 'Added to New Organization - POS System';
    const text = `Hello,

You have been successfully added to the organization (ID: ${orgId}) on our POS System.

You can log in using your existing credentials to access this organization.

Best regards,
The POS System Team`;

    await this.sendMail(email, subject, text);
  }

  async sendInvitationEmail(email: string, tempPassword: string) {
    const subject = 'Invitation to join POS System';
    const text = `Hello,

You have been invited to join the POS System. An account has been created for you under this email address.

Your temporary credentials are:
Email: ${email}
Password: ${tempPassword}

Please log in to your account and change your password immediately.

Best regards,
The POS System Team`;

    await this.sendMail(email, subject, text);
  }
}
