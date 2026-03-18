import type { Request } from 'express';

export const getAppUrl = (req?: Request) => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`.replace(/\/$/, '');
  }

  if (req) {
    return `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
};
