import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants.js';

export function securityMiddleware() {
  return [
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
    rateLimit(RATE_LIMIT),
  ];
}
