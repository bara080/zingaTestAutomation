/**
 * Per-test teardown for integration suite: reset Mongo + Redis + nock.
 * Imported via jest.config.js `setupFilesAfterEach` for the `integration` project.
 */
import nock from 'nock';
import { resetMongo } from './mongoSetup';
import { resetRedis } from './redisSetup';

afterEach(async () => {
  await resetMongo();
  await resetRedis();
  nock.cleanAll();
});
