import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  limit: parseInt(process.env.THROTTLER_LIMIT!, 10) || 1,
  ttl: parseInt(process.env.THROTTLER_TTL!, 10) || 30, // seconds
  blockDuration: parseInt(process.env.THROTTLER_BLOCK_DURATION!, 10) || 60, // seconds
  ignoreUserAgents: process.env.THROTTLER_IGNORE_USER_AGENTS
    ? process.env.THROTTLER_IGNORE_USER_AGENTS.split(',').map(pattern => new RegExp(pattern.trim()))
    : [],
  isGlobal: true,
}));
