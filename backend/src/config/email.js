import { Resend } from 'resend';

// Email sender configuration
export const EMAIL_FROM = 'noreply@send.subly.li';

// Create a proxy object that lazily initializes Resend
let resendInstance = null;

const resendProxy = new Proxy({}, {
  get(target, prop) {
    if (!resendInstance) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured in environment variables');
      }
      resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance[prop];
  }
});

export default resendProxy;