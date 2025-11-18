import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  // Per-IP throttling
  limit: parseInt(process.env.THROTTLER_LIMIT!, 10) || 50,
  ttl: parseInt(process.env.THROTTLER_TTL!, 10) || 60, // seconds
  blockDuration: parseInt(process.env.THROTTLER_BLOCK_DURATION!, 10) || 300, // seconds
  ignoreUserAgents: process.env.THROTTLER_IGNORE_USER_AGENTS
    ? process.env.THROTTLER_IGNORE_USER_AGENTS.split(',')
    : [],
  isGlobal: true,
}));
