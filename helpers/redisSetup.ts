/**
 * In-memory Redis using `ioredis-mock`. Mirrors Backend `config/redis.js`
 * shape so production controllers can be imported as-is.
 */
import RedisMock from 'ioredis-mock';

let client: any = null;

export function getRedis() {
  if (!client) {
    client = new RedisMock();
  }
  return client;
}

export async function resetRedis(): Promise<void> {
  if (client) await client.flushall();
}

export async function stopRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

/**
 * Replace `Backend/api/config/redis.js` with this module during tests.
 * Use in jest.setup or per-test:
 *   jest.mock('../../zinga/Backend/api/config/redis', () => require('../helpers/redisSetup'));
 */
export const connectRedis = jest.fn().mockResolvedValue(undefined);
export const disconnectRedis = jest.fn().mockResolvedValue(undefined);
