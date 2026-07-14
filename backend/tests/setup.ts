import 'dotenv/config';

process.env.JWT_SECRET ||= 'test-secret-for-vitest-only';
process.env.JWT_EXPIRES_IN ||= '1h';
