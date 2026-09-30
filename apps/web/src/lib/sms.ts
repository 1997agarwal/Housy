// OTP delivery. Providers:
//  - MSG91 when MSG91_AUTH_KEY + MSG91_TEMPLATE_ID are set (not yet verified against a live account).
//  - Otherwise "demo mode": the code is returned to the UI. Allowed outside production, or when HOUSY_DEV_OTP=1.
import { isDemoMode } from './demo';
export type Delivery = { mode: 'sms' } | { mode: 'demo'; code: string };
export class SmsUnavailableError extends Error {}

export async function deliverOtp(phone: string, code: string): Promise<Delivery> {
  const key = process.env.MSG91_AUTH_KEY, tpl = process.env.MSG91_TEMPLATE_ID;
  if (key && tpl) {
    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.search = new URLSearchParams({ template_id: tpl, mobile: `91${phone}`, authkey: key, otp: code }).toString();
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new SmsUnavailableError('Could not send the SMS. Please try again.');
    return { mode: 'sms' };
  }
  if (isDemoMode()) return { mode: 'demo', code };
  throw new SmsUnavailableError('SMS login is not configured on this server.');
}
