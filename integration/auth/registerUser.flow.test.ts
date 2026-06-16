/**
 * Critical-path P0: backend POST /api/auth/register validates required
 * fields and surfaces per-cause errors instead of generic 500s.
 * See zingaLocalDocs/backendRegistrationFlowAudit.md TODO-1 / TODO-2 —
 * this is the shape we want enforced once those fixes land.
 *
 * Note: scaffolded against the CURRENT (looser) backend. Mark `.skip` for
 * any assertion targeting validation rules not yet enforced; un-skip as
 * each TODO ships.
 */
import request from 'supertest';
import { startMongo, stopMongo } from '../../helpers/mongoSetup';
import { resetRedis } from '../../helpers/redisSetup';

// Mock Firebase Admin so createUser doesn't hit live.
// `virtual: true` so we don't require firebase-admin to be installed in zingaTest.
jest.mock(
  'firebase-admin',
  () => ({
    auth: () => ({
      createUser: jest.fn().mockResolvedValue({ uid: 'firebase_uid_test' }),
    }),
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    apps: [],
  }),
  { virtual: true },
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../../zinga/Backend/api/app');

beforeAll(async () => {
  await startMongo();
});

afterAll(async () => {
  await stopMongo();
});

beforeEach(async () => {
  await resetRedis();
});

const validBody = () => ({
  role: 'customer',
  firstName: 'Amani',
  lastName: 'Johnson',
  email: `amani_${Date.now()}@zingatest.com`,
  password: 'StrongP@ssw0rd!',
  phoneNumber: '+15551234567',
  isAgreedTermsCondition: true,
});

describe('POST /api/auth/register', () => {
  it('rejects missing email with auth.requiredFieldsMissing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody(), email: '' });
    expect(res.status).toBe(400);
    // CURRENT shape — replace with auth.emailRequired once TODO-1 D-1 ships.
    expect(res.body.message ?? res.body.code).toContain('requiredFieldsMissing');
  });

  it('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody(), password: '' });
    expect(res.status).toBe(400);
  });

  it('rejects missing role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody(), role: '' });
    expect(res.status).toBe(400);
  });

  // Failing-on-purpose so it surfaces when TODO-1 D-4 (email format validation) ships.
  it.skip('rejects malformed email format (TODO-1 D-4)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody(), email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('auth.invalidEmail');
  });

  // Failing-on-purpose so it surfaces when TODO-1 D-5 (password strength) ships.
  it.skip('rejects weak password (TODO-1 D-5)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody(), password: 'a' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('auth.passwordWeak');
  });

  // Failing-on-purpose so it surfaces when TODO-1 D-7 (T&C enforcement) ships.
  it.skip('rejects when T&C not accepted (TODO-1 D-7)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody(), isAgreedTermsCondition: false });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('auth.termsRequired');
  });
});
