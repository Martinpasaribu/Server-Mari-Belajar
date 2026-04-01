/* eslint-disable @typescript-eslint/no-unused-vars */
// src/shared/utils/email-checker.util.ts
import * as dns from 'node:dns';
import { promisify } from 'node:util';
import * as EmailValidator from 'email-validator';

const resolveMx = promisify(dns.resolveMx);

// List domain email sementara (bisa ditambah terus)
const BANNED_DOMAINS = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', 'yopmail.com'];

export class EmailHelper {
  static async isRealEmail(email: string): Promise<boolean> {
    const isSyntaxValid = EmailValidator.validate(email);
    if (!isSyntaxValid) return false;

    const domain = email.split('@')[1].toLowerCase();

    // 1. Cek apakah domain masuk blacklist
    if (BANNED_DOMAINS.includes(domain)) {
      console.warn(`[Email Check] Blocked disposable domain: ${domain}`);
      return false;
    }

    try {
      // 2. Cek MX Record (Hanya memastikan domain punya server email)
      const mxRecords = await resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error: any) {
      return false;
    }
  }
}